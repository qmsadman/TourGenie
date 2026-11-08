import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true, select: false },
    role: { type: String, default: "traveler" },
    is_active: { type: Boolean, default: true },
    email_verified: { type: Boolean, default: false },
    country: { type: String, default: "Bangladesh" },
    country_code: { type: String, default: "BD" },
    token_version: { type: Number, default: 0 },
    last_login_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

export default mongoose.model("User", userSchema);
