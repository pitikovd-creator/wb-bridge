export default async function handler(req, res) {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || apiKey !== process.env.BRIDGE_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const date = req.query?.date;
  if (!date) {
    return res.status(400).json({ error: "date is required (YYYY-MM-DD)" });
  }

  try {
    const r = await fetch(
      "https://statistics-api.wildberries.ru/api/v1/supplier/sales?dateFrom=" + encodeURIComponent(date),
      { headers: { Authorization: process.env.WB_STATS_TOKEN } }
    );

    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).send(text);
    }

    const raw = await r.json();
    const orders = Array.isArray(raw) ? raw.length : 0;
    const revenue = Array.isArray(raw) ? raw.reduce((s, x) => s + (x?.totalPrice || 0), 0) : 0;

    res.status(200).json({ date, orders, revenue, sample: Array.isArray(raw) ? raw.slice(0, 5) : [] });
  } catch (e) {
    res.status(500).json({ error: "bridge_failed", details: String(e) });
  }
}
