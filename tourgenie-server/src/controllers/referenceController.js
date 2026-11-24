import Country from "../models/Country.js";
import InterestTag from "../models/InterestTag.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Public reference data the client needs before anyone has signed in.

// The country picker on the register form. Core countries (the ones with a
// full destination catalogue) come first.
export const getCountries = asyncHandler(async (req, res) => {
  const countries = await Country.find({ is_active: true })
    .select("code name capital currency currency_symbol languages is_core")
    .sort({ is_core: -1, name: 1 })
    .lean();
  res.json({ countries });
});

// FR-03 — the interest chips on the Plan New Trip form.
export const getInterestTags = asyncHandler(async (req, res) => {
  const tags = await InterestTag.find({ is_active: true })
    .select("code label icon description group suits_destination_types sort_order")
    .sort({ sort_order: 1 })
    .lean();
  res.json({ tags });
});
