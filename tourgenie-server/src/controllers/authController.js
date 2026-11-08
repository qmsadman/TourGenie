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

export const getMe = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});
