// api/stock.js
export default async function handler(req, res) {
  // только GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // защита ключом моста
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.BRIDGE_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // dateFrom опциональный — по умолчанию сегодня (YYYY-MM-DD)
  const dateFrom =
    (typeof req.query.dateFrom === 'string' && req.query.dateFrom) ||
    new Date().toISOString().slice(0, 10);

  try {
    const url =
      'https://statistics-api.wildberries.ru/api/v1/supplier/stocks?dateFrom=' +
      encodeURIComponent(dateFrom);

    const wbResp = await fetch(url, {
      headers: {
        // для statistics-api токен передаётся без Bearer
        Authorization: process.env.WB_STATS_TOKEN,
      },
    });

    if (!wbResp.ok) {
      const text = await wbResp.text();
      return res.status(wbResp.status).json({ error: 'WB error', details: text });
    }

    const data = await wbResp.json();

    return res.status(200).json({
      dateFrom,
      total_items: Array.isArray(data) ? data.length : 0,
      // чтобы ответ был лёгким — покажем первые 20 записей
      items: Array.isArray(data) ? data.slice(0, 20) : [],
    });
  } catch (e) {
    return res.status(500).json({ error: 'bridge_failed', details: String(e) });
  }
}
