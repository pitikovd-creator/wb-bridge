// api/stock.js
export default async function handler(req, res) {
  const token = process.env.WB_API_KEY;

  try {
    const response = await fetch(
      "https://suppliers-api.wildberries.ru/api/v3/stocks", // эндпоинт остатков
      {
        method: "GET",
        headers: {
          "Authorization": token,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Ошибка при получении остатков", details: error.message });
  }
}
