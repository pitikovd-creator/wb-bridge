import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// --- защита ключом моста (НЕ WB токен) ---
function guard(req, res, next) {
  const clientKey = req.header("X-Api-Key");
  if (!clientKey || clientKey !== process.env.BRIDGE_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// --- healthcheck (на всякий случай несколько путей) ---
app.get(["/", "/api", "/api/"], (req, res) => {
  res.send("WB Bridge is alive");
});

// --- продажи за день ---
app.get("/sales/daily", guard, async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: "date is required (YYYY-MM-DD)" });

  try {
    const wbResp = await fetch(
      "https://statistics-api.wildberries.ru/api/v1/supplier/sales?dateFrom=" + encodeURIComponent(date),
      { headers: { Authorization: process.env.WB_STATS_TOKEN } }
    );

    if (!wbResp.ok) {
      const t = await wbResp.text();
      return res.status(wbResp.status).json({ error: "WB error", details: t });
    }

    const raw = await wbResp.json();
    const orders = Array.isArray(raw) ? raw.length : 0;
    const revenue = Array.isArray(raw) ? raw.reduce((sum, x) => sum + (x?.totalPrice || 0), 0) : 0;

    res.json({ date, orders, revenue, sample: Array.isArray(raw) ? raw.slice(0, 5) : [] });
  } catch (e) {
    res.status(500).json({ error: "bridge_failed", details: String(e) });
  }
});

// --- остатки ---
app.get("/stock", guard, async (req, res) => {
  try {
    const wbResp = await fetch(
      "https://statistics-api.wildberries.ru/api/v1/supplier/stocks",
      { headers: { Authorization: process.env.WB_STATS_TOKEN } }
    );
    if (!wbResp.ok) {
      const t = await wbResp.text();
      return res.status(wbResp.status).json({ error: "WB error", details: t });
    }
    const data = await wbResp.json();
    res.json({
      total_items: Array.isArray(data) ? data.length : 0,
      items: Array.isArray(data) ? data.slice(0, 20) : []
    });
  } catch (e) {
    res.status(500).json({ error: "bridge_failed", details: String(e) });
  }
});

// --- ОБЯЗАТЕЛЬНО: экспортируем Express-приложение ---
export default app;
