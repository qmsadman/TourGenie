import express from "express";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes.js";
import tripRoutes from "./routes/tripRoutes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

const app = express();
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(morgan("dev"));
app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "TourGenie API" }));
app.use("/api/auth", authRoutes);
app.use("/api/trips", tripRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
