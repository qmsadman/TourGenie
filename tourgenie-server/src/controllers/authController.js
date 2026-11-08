import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateToken } from "../utils/generateToken.js";

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    language: user.language,
    country: user.country,
    country_code: user.country_code,
    preferences: user.preferences,
  };
}

export const login = asyncHandler(async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const user = await User.findOne({ email }).select("+password_hash");

  if (!user || !user.is_active || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ message: "Email or password is incorrect" });
  }

  user.last_login_at = new Date();
  await user.save();
  res.json({ token: generateToken(user), user: publicUser(user) });
});

export const register = asyncHandler(async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required" });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "Enter a valid email address" });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }
  if (await User.exists({ email })) {
    return res.status(409).json({ message: "An account with this email already exists" });
  }

  const user = await User.create({
    name,
    email,
    password_hash: await bcrypt.hash(password, 10),
    email_verified: false,
  });
  res.status(201).json({ token: generateToken(user), user: publicUser(user) });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});
