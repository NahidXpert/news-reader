import "dotenv/config";
import express from "express";
import helmet from "helmet";
import { newsRouter } from "./routes/news.js";

const app = express();
const port = Number(process.env.PORT || 3000);
const production = process.env.NODE_ENV === "production";

app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "20kb" }));
app.use((req, res, next) => {
  const origin = process.env.CLIENT_ORIGIN;
  if (origin && req.headers.origin === origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  if (req.method !== "GET" && req.headers.origin && req.headers.origin !== origin) {
    return res.status(403).json({ error: "Request origin is not allowed." });
  }
  next();
});

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/news", newsRouter);
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "An unexpected server error occurred." });
});

if (production) {
  app.use(express.static("dist"));
  app.get("*", (_req, res) => res.sendFile("index.html", { root: "dist" }));
}

app.listen(port, () => console.log(`Daily Briefing API listening on port ${port}`));
