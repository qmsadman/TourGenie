// npm run seed
//
// Loads the reference catalogue (countries, destinations, interest tags) and
// the demo account. Every write is an upsert on a stable key — country code,
// destination slug, tag code, email — so the seed can be run again at any
// time without duplicating rows or touching accounts people created.
//
// Flags:
//   --catalog-only   reference data only, no demo account or trip
//   --demo-only      demo account and trip only
import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Country from "../models/Country.js";
import Destination from "../models/Destination.js";
import InterestTag from "../models/InterestTag.js";
import User from "../models/User.js";
import Trip from "../models/Trip.js";
import { countries } from "./data/countries.js";
import { destinations } from "./data/catalog.js";
import { interestTags } from "./data/reference.js";
import { validateCatalog } from "./validateCatalog.js";

const args = new Set(process.argv.slice(2));
const catalogOnly = args.has("--catalog-only");
const demoOnly = args.has("--demo-only");

const demoEmail = "moontashir@tourgenie.ai";
const demoPassword = "Traveler123!";

// Upsert by key, without replacing the whole document: a row an admin has
// soft-deleted keeps its deleted_at, and nothing the seed doesn't own is lost.
async function upsertAll(Model, rows, key) {
  if (rows.length === 0) return 0;
  const result = await Model.bulkWrite(
    rows.map((row) => ({
      updateOne: {
        filter: { [key]: row[key] },
        update: { $set: row },
        upsert: true,
      },
    })),
    { ordered: false },
  );
  return result.upsertedCount + result.modifiedCount;
}

function toDestinationDoc(row) {
  const country = countries.find((c) => c.code === (row.country_code || "BD"));
  const doc = {
    ...row,
    country: row.country || country?.name || "Bangladesh",
    country_code: row.country_code || "BD",
  };
  // bulkWrite skips the pre-validate hook that normally mirrors lat_lng into
  // the GeoJSON point, so it is filled in here.
  if (Number.isFinite(row.lat_lng?.lat) && Number.isFinite(row.lat_lng?.lng)) {
    doc.location = { type: "Point", coordinates: [row.lat_lng.lng, row.lat_lng.lat] };
  }
  return doc;
}

async function seedCatalog() {
  // Refuse to write a catalogue that doesn't hang together.
  validateCatalog();

  const countryCount = await upsertAll(Country, countries, "code");
  const tagCount = await upsertAll(InterestTag, interestTags, "code");
  const destinationCount = await upsertAll(Destination, destinations.map(toDestinationDoc), "slug");
  await Promise.all([Country.syncIndexes(), InterestTag.syncIndexes(), Destination.syncIndexes()]);

  console.log(`Countries:      ${countries.length} (${countryCount} written)`);
  console.log(`Interest tags:  ${interestTags.length} (${tagCount} written)`);
  console.log(`Destinations:   ${destinations.length} (${destinationCount} written)`);
}

async function seedDemo() {
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
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
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
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );

  console.log(`Demo account:   ${demoEmail}`);
  console.log("Demo trip:      Cox's Bazar weekend");
}

try {
  await connectDB();
  if (!demoOnly) await seedCatalog();
  if (!catalogOnly) await seedDemo();
  console.log("Seed complete.");
} catch (error) {
  console.error("Could not seed the database:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
