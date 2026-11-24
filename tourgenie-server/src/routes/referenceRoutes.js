import { Router } from "express";
import { getCountries, getInterestTags } from "../controllers/referenceController.js";

const router = Router();

router.get("/countries", getCountries);
router.get("/interest-tags", getInterestTags); // FR-03

export default router;
