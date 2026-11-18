import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import PasswordReset, {
  OTP_TTL_SECONDS,
  RESEND_COOLDOWN_SECONDS,
  MAX_SENDS_PER_WINDOW,
  SEND_WINDOW_SECONDS,
  MAX_VERIFY_ATTEMPTS,
} from "../models/PasswordReset.js";
import { sendMail, passwordResetEmail } from "../services/mailer.js";
import { generateToken } from "../utils/generateToken.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { loginFailureLimiter } from "../middleware/rateLimit.js";

// Login, register and /me all describe the account the same way.
function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    language: user.language,
    country: user.country,
    country_code: user.country_code,
    email_verified: user.email_verified,
    created_at: user.created_at,
    last_login_at: user.last_login_at,
  };
}

const MIN_PASSWORD_LENGTH = 6;

// Deliberately loose — it rejects what is obviously not an address (no @, no
// dot in the domain, spaces) without trying to out-guess the RFC and turn
// away someone's real, unusual mailbox. An address that isn't real is an
// account that can never be recovered, because the reset code has nowhere
// to go.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

// FR-01 — User Registration
export const register = asyncHandler(async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required" });
  }
  if (!EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ message: "That doesn't look like a valid email address" });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
  }
  if (await User.exists({ email })) {
    return res.status(409).json({ message: "An account with this email already exists" });
  }

  const user = await User.create({
    name,
    email,
    password_hash: await bcrypt.hash(password, 10),
  });
  res.status(201).json({ token: generateToken(user), user: publicUser(user) });
});

// FR-02 — Login & Authentication
export const login = asyncHandler(async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email }).select("+password_hash");
  // An unknown address is counted the same as a wrong password: a limiter
  // that only fired on real accounts would tell an attacker which exist.
  if (!user || !user.is_active || !(await bcrypt.compare(password, user.password_hash))) {
    loginFailureLimiter.penalise(req);
    return res.status(401).json({ message: "Email or password is incorrect" });
  }

  user.last_login_at = new Date();
  await user.save();
  res.json({ token: generateToken(user), user: publicUser(user) });
});

// Returns the logged-in user's own profile
export const getMe = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// FR-02 (password recovery) — "forgot password" by emailed one-time code.
//
// Three steps, so the code is only ever typed once:
//   1. POST /auth/forgot-password  → mails a 6-digit code (also the resend)
//   2. POST /auth/verify-otp       → trades a correct code for a reset token
//   3. POST /auth/reset-password   → sets the new password with that token
//
// Whether an account exists is never revealed: step 1 answers the same way
// either way, and the cooldown/rate limits are keyed on the typed address so
// their timing doesn't give the answer away either.

const RESET_TOKEN_TTL_SECONDS = 10 * 60;
const OTP_MINUTES = Math.round(OTP_TTL_SECONDS / 60);

function generateOtp() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
}

export const forgotPassword = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").toLowerCase().trim();
  if (!email) return res.status(400).json({ message: "Email is required" });

  const now = Date.now();

  // Resend cooldown — one code per address per 30 seconds.
  const last = await PasswordReset.findOne({ email }).sort({ created_at: -1 });
  if (last) {
    const elapsed = (now - last.created_at.getTime()) / 1000;
    if (elapsed < RESEND_COOLDOWN_SECONDS) {
      const wait = Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed);
      return res.status(429).json({
        message: `A code was just sent. Please wait ${wait}s before asking for another.`,
        retry_after: wait,
      });
    }
  }

  // And a ceiling on how many can be asked for in a quarter of an hour.
  const windowStart = new Date(now - SEND_WINDOW_SECONDS * 1000);
  const sends = await PasswordReset.countDocuments({ email, created_at: { $gte: windowStart } });
  if (sends >= MAX_SENDS_PER_WINDOW) {
    return res.status(429).json({
      message: "Too many reset codes requested for this email. Please try again in 15 minutes.",
      retry_after: SEND_WINDOW_SECONDS,
    });
  }

  const payload = {
    message: "If an account exists for that email, a 6-digit code is on its way. Check your inbox.",
    expires_in: OTP_TTL_SECONDS,
    resend_after: RESEND_COOLDOWN_SECONDS,
  };

  const user = await User.findOne({ email });
  if (!user || !user.is_active) return res.json(payload);

  // Any earlier code for this account stops working the moment a new one is
  // issued, so only the newest email in the inbox is the live one.
  await PasswordReset.updateMany(
    { user_id: user._id, consumed_at: null, expires_at: { $gt: new Date() } },
    { $set: { expires_at: new Date() } }
  );

  const otp = generateOtp();
  const reset = await PasswordReset.create({
    user_id: user._id,
    email,
    otp_hash: await bcrypt.hash(otp, 10),
    expires_at: new Date(now + OTP_TTL_SECONDS * 1000),
    ip: req.ip || "",
  });

  const { subject, text, html } = passwordResetEmail({ name: user.name, otp, minutes: OTP_MINUTES });
  const delivery = await sendMail({ to: user.email, subject, text, html });

  if (!delivery.delivered && delivery.reason === "send_failed") {
    // The row would otherwise sit there burning the visitor's send quota for a
    // code they never received.
    await PasswordReset.deleteOne({ _id: reset._id });
    return res.status(502).json({ message: "We couldn't send the email just now. Please try again in a moment." });
  }

  // With no mailbox wired up the code has nowhere to go, so hand it back in
  // development to keep the flow testable. Never in production.
  if (!delivery.delivered && process.env.NODE_ENV !== "production") {
    payload.dev_otp = otp;
    payload.message = "Email isn't configured on this server — use the code shown below (development only).";
  }

  res.json(payload);
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").toLowerCase().trim();
  const otp = String(req.body.otp || "").trim();

  if (!email || !otp) return res.status(400).json({ message: "Email and code are required" });

  const reset = await PasswordReset.findOne({ email, consumed_at: null })
    .sort({ created_at: -1 })
    .select("+otp_hash");

  if (!reset) {
    return res.status(400).json({ message: "That code isn't valid. Request a new one." });
  }
  if (reset.expires_at.getTime() <= Date.now()) {
    return res.status(400).json({ message: "That code has expired. Request a new one.", expired: true });
  }
  if (reset.attempts >= MAX_VERIFY_ATTEMPTS) {
    return res.status(429).json({ message: "Too many incorrect attempts. Request a new code.", expired: true });
  }

  const match = await bcrypt.compare(otp, reset.otp_hash);
  if (!match) {
    reset.attempts += 1;
    await reset.save();
    const left = MAX_VERIFY_ATTEMPTS - reset.attempts;
    return res.status(400).json({
      message:
        left > 0
          ? `That code is incorrect — ${left} attempt${left === 1 ? "" : "s"} left.`
          : "That code is incorrect. Request a new one.",
      attempts_left: Math.max(left, 0),
      expired: left <= 0,
    });
  }

  reset.verified_at = new Date();
  await reset.save();

  // Short-lived and single-purpose: it only unlocks step 3, and `protect`
  // rejects it because it carries no `id` claim.
  const reset_token = jwt.sign({ rid: reset._id.toString(), purpose: "password_reset" }, process.env.JWT_SECRET, {
    expiresIn: RESET_TOKEN_TTL_SECONDS,
  });

  res.json({ message: "Code verified — choose a new password.", reset_token, expires_in: RESET_TOKEN_TTL_SECONDS });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { reset_token, password } = req.body;
  if (!reset_token || !password) {
    return res.status(400).json({ message: "Reset token and new password are required" });
  }
  if (String(password).length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
  }

  let decoded;
  try {
    decoded = jwt.verify(reset_token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "This reset session has expired. Start again." });
  }
  if (decoded.purpose !== "password_reset" || !decoded.rid) {
    return res.status(401).json({ message: "This reset session isn't valid. Start again." });
  }

  const reset = await PasswordReset.findById(decoded.rid);
  if (!reset || !reset.verified_at || reset.consumed_at) {
    return res.status(401).json({ message: "This reset session has already been used. Start again." });
  }

  const user = await User.findById(reset.user_id);
  if (!user || !user.is_active) {
    return res.status(404).json({ message: "Account not found" });
  }

  user.password_hash = await bcrypt.hash(password, 10);
  // Whoever forced this reset may already be holding a live session on the
  // account; the reset is what has to end it. Every token signed under the
  // old version stops verifying — see middleware/auth.js.
  user.token_version = (user.token_version || 0) + 1;
  await user.save();

  reset.consumed_at = new Date();
  await reset.save();
  // Anything else outstanding for this account dies with it.
  await PasswordReset.updateMany(
    { user_id: user._id, _id: { $ne: reset._id }, consumed_at: null },
    { $set: { expires_at: new Date() } }
  );

  res.json({ message: "Password updated — you can now log in." });
});

// Changing a password while logged in — the reset-by-email flow is for
// people who can't. The current password is required so a walk-up on an
// unlocked laptop can't lock the owner out of their own account.
export const changePassword = asyncHandler(async (req, res) => {
  const { current_password, new_password } = req.body || {};
  if (!current_password || !new_password) {
    return res.status(400).json({ message: "Current and new password are both required" });
  }
  if (String(new_password).length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ message: `New password must be at least ${MIN_PASSWORD_LENGTH} characters` });
  }

  const user = await User.findById(req.user._id).select("+password_hash");
  if (!user) return res.status(404).json({ message: "Account not found" });

  const match = await bcrypt.compare(current_password, user.password_hash);
  if (!match) return res.status(401).json({ message: "That isn't your current password" });

  if (await bcrypt.compare(new_password, user.password_hash)) {
    return res.status(400).json({ message: "The new password is the same as the current one" });
  }

  user.password_hash = await bcrypt.hash(new_password, 10);
  // Same as the reset flow: every other session on this account ends here.
  user.token_version = (user.token_version || 0) + 1;
  await user.save();

  // Any outstanding reset code is void — the password it was issued for is
  // gone.
  await PasswordReset.updateMany(
    { user_id: user._id, consumed_at: null },
    { $set: { expires_at: new Date() } }
  );

  // Including the session doing the changing — so it is handed a replacement
  // rather than being thrown back to the login screen for using the form
  // correctly.
  res.json({ message: "Password changed.", token: generateToken(user) });
});
