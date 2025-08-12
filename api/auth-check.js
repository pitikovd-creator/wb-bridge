export default function handler(req, res) {
  const received = req.headers["x-api-key"] || null;
  const expected = process.env.BRIDGE_API_KEY || null;
  res.status(200).json({
    received,
    expected_len: expected ? expected.length : 0,
    match: Boolean(received && expected && received === expected)
  });
}
