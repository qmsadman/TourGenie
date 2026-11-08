import mongoose from "mongoose";

const tripSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, trim: true, default: "" },
    origin: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    travelers: { type: Number, required: true, min: 1 },
    budget: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["draft", "planned", "active", "completed"], default: "planned" },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

export default mongoose.model("Trip", tripSchema);
