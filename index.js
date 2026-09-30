import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ensureAdmin } from "./lib/seed.js";

import authRouter from "./routes/auth.js";
import contactRouter from "./routes/contact.js";
import leadsRouter from "./routes/leads.js";
import assistantRouter from "./routes/assistant.js";
import analyticsRouter from "./routes/analytics.js";
import clicksRouter from "./routes/clicks.js";
import devicesRouter from "./routes/devices.js";

dotenv.config();

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.json({ name: "portfolio-admin-backend", status: "ok" });
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, now: new Date().toISOString() });
});

app.use("/api/auth", authRouter);
app.use("/api", contactRouter);
app.use("/api/leads", leadsRouter);
app.use("/api/assistant", assistantRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/clicks", clicksRouter);
app.use("/api/devices", devicesRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found." });
});

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error."
      : err.message || "Internal server error.";
  res.status(err.status || 500).json({ error: message });
});

const port = process.env.PORT || 3000;

ensureAdmin()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("[startup] Failed to seed admin:", err);
    // Still start the server so auth/health endpoints remain available.
    app.listen(port, () => {
      console.log(`Server running on port ${port} (admin seed skipped)`);
    });
  });

export default app;
