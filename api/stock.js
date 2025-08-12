export default async function handler(req, res) {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || apiKey !== process.env.BRIDGE_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const r = await fetch(
      "https://statistics-api.wildberries.ru/api/v1/supplier/stocks",
      { headers: { Authorization: process.env.WB_STATS_TOKEN } }
    );

    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).send(text);
    }

    const data = await r.json();
    res.status(200).json({
      total_items: Array.isArray(data) ? data.length : 0,
      items: Array.isArray(data) ? data.slice(0, 20) : []
    });
  } catch (e) {
    res.status(500).json({ error: "bridge_failed", details: String(e) });
  }
}
