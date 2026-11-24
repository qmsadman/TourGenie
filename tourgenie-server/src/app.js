import express from "express";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes.js";
import tripRoutes from "./routes/tripRoutes.js";
import destinationRoutes from "./routes/destinationRoutes.js";
import referenceRoutes from "./routes/referenceRoutes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

const app = express();

// The sign-in limiter counts failures per address, so `req.ip` has to be the
// visitor's and not the proxy's. Opt-in, because trusting a forwarded header
// that nobody is actually setting lets a caller claim any address it likes
// and walk straight past the limiter. Set TRUST_PROXY to the number of
// proxies in front of this process when deploying behind one.
//
// The value is validated rather than passed through. Express hands whatever
// it is given to proxy-addr, which parses it lazily — the first time anything
// reads `req.ip`. A typo therefore does not fail at boot with a clear message;
// it throws `invalid IP address` from inside a dependency on every request, so
// the whole API answers 500 and the stack trace never mentions the variable
// that caused it. TRUST_PROXY=a cost an afternoon of exactly that. A hop count
// or one of proxy-addr's named presets is accepted; anything else is refused
// here, loudly, and the app runs untrusting rather than not at all.
const PROXY_PRESETS = ["loopback", "linklocal", "uniquelocal"];

if (process.env.TRUST_PROXY) {
  const raw = process.env.TRUST_PROXY.trim();
  const hops = Number(raw);

  if (Number.isInteger(hops) && hops >= 0) {
    app.set("trust proxy", hops);
  } else if (PROXY_PRESETS.includes(raw)) {
    app.set("trust proxy", raw);
  } else {
    console.warn(
      `[config] Ignoring TRUST_PROXY="${raw}" — expected a hop count (e.g. 1) or one of ` +
        `${PROXY_PRESETS.join(", ")}. Proxy headers will not be trusted, so rate limiting ` +
        `will key on the proxy's address rather than the visitor's.`
    );
  }
}

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
app.use("/api/destinations", destinationRoutes);
app.use("/api/reference", referenceRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
