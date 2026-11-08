import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Please log in to continue" });
  }

  let decoded;
  try {
    decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Your session has expired. Please log in again." });
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.is_active || (decoded.tv ?? 0) !== (user.token_version || 0)) {
    return res.status(401).json({ message: "Your account or session is no longer active" });
  }

  req.user = user;
  next();
});
