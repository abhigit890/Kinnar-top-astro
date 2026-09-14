export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

  const { action, day, month, year, name } = req.body;
  if (!day || !month || !year || !name) {
    return res.status(400).json({ error: "Missing name or date of birth" });
  }

  const endpointMap = {
    table: "numero_table",
    report: "numero_report",
    favtime: "numero_fav_time",
    vastu: "numero_place_vastu",
    fasts: "numero_fasts_report",
    favlord: "numero_fav_lord",
    favmantra: "numero_fav_mantra"
  };
  const path = endpointMap[action];
  if (!path) return res.status(400).json({ error: "Unknown action" });

  try {
    const response = await fetch(`https://json.astrologyapi.com/v1/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept-Language": "en",
        "x-astrologyapi-key": process.env.ASTROLOGY_API_KEY
      },
      body: new URLSearchParams({ day, month, year, name })
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Something went wrong", details: err.message });
  }
}
