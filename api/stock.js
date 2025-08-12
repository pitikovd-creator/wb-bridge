// api/stock.js
export default async function handler(req, res) {
  // Разрешаем только GET
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Проверка ключа моста
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || apiKey !== process.env.BRIDGE_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // ВАЖНО: у WB обязателен Bearer
    const resp = await fetch(
      "https://statistics-api.wildberries.ru/api/v1/supplier/stocks",
      {
        headers: {
          Authorization: `Bearer ${process.env.WB_STATS_TOKEN}`,
        },
      }
    );

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(resp.status).json({ error: "WB error", details: text });
    }

    const data = await resp.json();
    return res.status(200).json({
      total_items: Array.isArray(data) ? data.length : 0,
      items: Array.isArray(data) ? data.slice(0, 20) : [],
    });
  } catch (e) {
    return res.status(500).json({ error: "bridge_failed", details: String(e) });
  }
}
