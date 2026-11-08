import Trip from "../models/Trip.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getMyTrips = asyncHandler(async (req, res) => {
  const trips = await Trip.find({ user_id: req.user._id })
    .sort({ start_date: 1, created_at: -1 })
    .lean();
  res.json({ trips });
});
