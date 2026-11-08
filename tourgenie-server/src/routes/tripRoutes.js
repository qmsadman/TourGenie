import { Router } from "express";
import { getMyTrips } from "../controllers/tripController.js";
import { protect } from "../middleware/auth.js";

const router = Router();
router.get("/", protect, getMyTrips);

export default router;
