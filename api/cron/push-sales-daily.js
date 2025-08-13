// api/cron/push-sales-daily.js
import { putGitJson } from "./_github.js";

const todayISO = () => new Date().toISOString().slice(0, 10);

export default async function handler(req, res) {
  try {
    const base = process.env.PUBLIC_BASE_URL || "https://wb-bridge.vercel.app";
    const date = (req.query?.date && String(req.query.date)) || todayISO();

    const r = await fetch(`${base}/api/sales-daily?date=${encodeURIComponent(date)}`, {
      headers: { "X-Api-Key": process.env.BRIDGE_API_KEY }
    });

    if (!r.ok) {
      const t = await r.text();
      return res.status(r.status).json({ error: "bridge_sales_failed", details: t });
    }

    const data = await r.json();

    await putGitJson({
      path: process.env.GH_SALES_PATH || "sales.json",
      json: {
        updatedAt: new Date().toISOString(),
        ...data
      }
    });

    return res.status(200).json({ ok: true, date });
  } catch (e) {
    return res.status(500).json({ error: "cron_push_sales_failed", details: String(e) });
  }
}
