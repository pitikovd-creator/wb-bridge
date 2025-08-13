// api/cron/push-stocks.js
import { putGitJson } from "./_github.js";

export default async function handler(req, res) {
  try {
    const base = process.env.PUBLIC_BASE_URL || "https://wb-bridge.vercel.app";

    // Берём остатки с твоего же API (ключ моста читается из env)
    const r = await fetch(`${base}/api/stock`, {
      headers: { "X-Api-Key": process.env.BRIDGE_API_KEY }
    });

    if (!r.ok) {
      const t = await r.text();
      return res.status(r.status).json({ error: "bridge_stock_failed", details: t });
    }

    const data = await r.json();

    // Пишем в GitHub репозиторий
    await putGitJson({
      path: process.env.GH_STOCKS_PATH || "stocks.json",
      json: {
        updatedAt: new Date().toISOString(),
        ...data
      }
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "cron_push_stocks_failed", details: String(e) });
  }
}
