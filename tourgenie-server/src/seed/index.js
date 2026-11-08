import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import Trip from "../models/Trip.js";

const demoEmail = "moontashir@tourgenie.ai";
const demoPassword = "Traveler123!";

try {
  await connectDB();

  const user = await User.findOneAndUpdate(
    { email: demoEmail },
    {
      $set: {
        name: "Moontashir Azim",
        email: demoEmail,
        password_hash: await bcrypt.hash(demoPassword, 10),
        role: "traveler",
        is_active: true,
        email_verified: true,
        country: "Bangladesh",
        country_code: "BD",
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 4);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 3);

  await Trip.findOneAndUpdate(
    { user_id: user._id, title: "Cox's Bazar weekend" },
    {
      $set: {
        origin: "Dhaka",
        destination: "Cox's Bazar",
        start_date: startDate,
        end_date: endDate,
        travelers: 2,
        budget: 20000,
        status: "planned",
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  console.log(`Demo account ready: ${demoEmail}`);
  console.log("Demo trip ready: Cox's Bazar weekend");
} catch (error) {
  console.error("Could not seed the demo app:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
