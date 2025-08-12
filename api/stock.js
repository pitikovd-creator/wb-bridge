// api/stock.js — остатки, БЕЗ параметров дат
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // ключ клиента моста
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || apiKey !== process.env.BRIDGE_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // ВАЖНО: правильный эндпоинт остатков WB
    const url = "https://statistics-api.wildberries.ru/api/v1/supplier/stocks";

    const r = await fetch(url, {
      headers: { Authorization: process.env.WB_STATS_TOKEN }
    });

    // если WB вернул ошибку — отдаём как есть, чтобы видеть причину
    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).send(text);
    }

    const data = await r.json();
    return res.status(200).json({
      total_items: Array.isArray(data) ? data.length : 0,
      items: Array.isArray(data) ? data.slice(0, 20) : []
    });
  } catch (e) {
    return res.status(500).json({ error: "bridge_failed", details: String(e) });
  }
}
