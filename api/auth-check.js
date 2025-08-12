export default function handler(req, res) {
  const got = String(req.headers["x-api-key"] || "");
  const exp = String(process.env.BRIDGE_API_KEY || "");
  res.status(200).json({
    received: got,
    expected_len: exp.length,
    match: Boolean(exp && got && got === exp),
  });
}
