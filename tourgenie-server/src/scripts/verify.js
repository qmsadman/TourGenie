// npm run db:verify
//
// Runs one representative query per catalogue feature, using the same shape
// the matching API route uses. If every check passes, the database can answer
// those features without an external call. Exits non-zero on any failure.
//
// Checks are added here as each feature's data lands in the seed.

import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";

import Destination from "../models/Destination.js";
import Country from "../models/Country.js";
import InterestTag from "../models/InterestTag.js";
import { CORE_COUNTRIES } from "../seed/validateCatalog.js";

const results = [];
function check(fr, label, ok, detail) {
  results.push({ fr, label, ok, detail });
  console.log(`  ${ok ? "✓" : "✗"}  ${fr.padEnd(7)} ${label.padEnd(38)} ${detail}`);
}

async function run() {
  await connectDB();
  console.log(`\nVerifying "${mongoose.connection.db.databaseName}" — one query per feature\n`);

  // ── FR-03: destination search ──
  const searchHits = await Destination.find(
    { $text: { $search: "beach coral island" }, is_active: true },
    { score: { $meta: "textScore" } },
  ).sort({ score: { $meta: "textScore" } }).limit(5).lean();
  check("FR-03", "Destination text search", searchHits.length > 0,
    searchHits.map((d) => d.name).join(", ") || "no hits");

  const interests = await InterestTag.countDocuments({ is_active: true });
  check("FR-03", "Interest chips for the plan form", interests > 0, `${interests} tags`);

  // ── Country catalogue ──
  const coreCountries = await Country.find({ is_core: true, is_active: true }).sort({ code: 1 }).lean();
  check("—", "Core country profiles", coreCountries.length === CORE_COUNTRIES.length,
    coreCountries.map((c) => c.code).join(", ") || "none");

  const perCountry = await Destination.aggregate([
    { $match: { is_active: true } },
    { $group: { _id: "$country_code", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  const countryCodes = new Set((await Country.find().select("code").lean()).map((c) => c.code));
  const unknown = perCountry.filter((row) => !countryCodes.has(row._id));
  check("—", "Destinations per core country",
    CORE_COUNTRIES.every((code) => perCountry.some((row) => row._id === code && row.count > 0)),
    perCountry.map((row) => `${row._id}: ${row.count}`).join(", "));
  check("—", "Destinations reference a known country", unknown.length === 0,
    unknown.length ? unknown.map((row) => row._id).join(", ") : "all linked");

  // ── Geo ──
  const total = await Destination.countDocuments();
  const withPoint = await Destination.countDocuments({ "location.coordinates.0": { $exists: true } });
  check("—", "Destinations with GeoJSON point", total > 0 && withPoint === total, `${withPoint}/${total}`);

  const nearDhaka = await Destination.find({
    location: { $near: { $geometry: { type: "Point", coordinates: [90.4125, 23.8103] }, $maxDistance: 250000 } },
  }).limit(3).lean();
  check("—", "Destinations near Dhaka ($near)", nearDhaka.length > 0,
    nearDhaka.map((d) => d.name).join(", ") || "none");

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.\n`);
  if (failed.length) process.exitCode = 1;
}

try {
  await run();
} catch (error) {
  console.error("Verification failed:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
