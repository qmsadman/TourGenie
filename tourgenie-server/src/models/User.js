// FR-01 / FR-02 — accounts and authentication.
import mongoose from "mongoose";
import { TIMESTAMPS } from "./_shared.js";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true, select: false },
    role: { type: String, enum: ["traveler", "moderator", "admin", "owner"], default: "traveler" },
    language: { type: String, default: "en" },
    is_active: { type: Boolean, default: true },
    email_verified: { type: Boolean, default: false },
    country: { type: String, default: "Bangladesh" },
    country_code: { type: String, default: "BD", uppercase: true, minlength: 2, maxlength: 2 },

    // Bumped whenever the password changes. Every issued JWT carries the
    // version it was signed under, so changing a password — the one action a
    // person takes precisely because someone else may be holding their
    // session — actually ends those sessions instead of leaving them valid
    // for the rest of the week the token was good for.
    token_version: { type: Number, default: 0 },
    last_login_at: { type: Date, default: null },
  },
  TIMESTAMPS
);

export default mongoose.model("User", userSchema);
