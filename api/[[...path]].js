import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// --- защита по ключу ---
function guard(req, res, next) {
  const key = req.header("X-Api-Key");
  if (!key || key !== process.env.BRIDGE_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// --- healthcheck ---
app.get(["/", "/api", "/api/"], (_req, res) => {
  res.send("WB Bridge is alive");
});

// --- продажи за день ---
app.get(["/sales/daily", "/api/sales/daily"], guard, async (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ error: "date is required (YYYY-MM-DD)" });
  }
  try {
    const r = await fetch(
      "https://statistics-api.wildberries.ru/api/v1/supplier/sales?dateFrom=" +
        encodeURIComponent(date),
      { headers: { Authorization: process.env.WB_STATS_TOKEN } }
    );
    if (!r.ok) return res.status(r.status).send(await r.text());

    const raw = await r.json();
    const orders = Array.isArray(raw) ? raw.length : 0;
    const revenue = Array.isArray(raw)
      ? raw.reduce((s, x) => s + (x?.totalPrice || 0), 0)
      : 0;
    res.json({
      date,
      orders,
      revenue,
      sample: Array.isArray(raw) ? raw.slice(0, 5) : [],
    });
  } catch (e) {
    res.status(500).json({ error: "bridge_failed", details: String(e) });
  }
});

// --- остатки ---
app.get(["/stock", "/api/stock"], guard, async (_req, res) => {
  try {
    const r = await fetch(
      "https://statistics-api.wildberries.ru/api/v1/supplier/stocks",
      { headers: { Authorization: process.env.WB_STATS_TOKEN } }
    );
    if (!r.ok) return res.status(r.status).send(await r.text());

    const data = await r.json();
    res.json({
      total_items: Array.isArray(data) ? data.length : 0,
      items: Array.isArray(data) ? data.slice(0, 20) : [],
    });
  } catch (e) {
    res.status(500).json({ error: "bridge_failed", details: String(e) });
  }
});

// --- обязательный экспорт ---
export default function handler(req, res) {
  return app(req, res);
}
