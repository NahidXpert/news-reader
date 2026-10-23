import express from "express";
import app from "./app.js";

const port = Number(process.env.PORT || 3000);

if (process.env.NODE_ENV === "production") {
  app.use(express.static("dist"));
  app.get("*", (_req, res) => res.sendFile("index.html", { root: "dist" }));
}

app.listen(port, () => console.log(`Daily Briefing API listening on port ${port}`));
