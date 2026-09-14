export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

  const { action, m_day, m_month, m_year, m_hour, m_min, m_lat, m_lon, m_tzone,
          f_day, f_month, f_year, f_hour, f_min, f_lat, f_lon, f_tzone } = req.body;

  if (!m_day || !f_day) {
    return res.status(400).json({ error: "Missing birth details for both people" });
  }

  const endpointMap = {
    birthdetails: "match_birth_details",
    astrodetails: "match_astro_details",
    planetdetails: "match_planet_details",
    ashtakoot: "match_ashtakoot_points",
    report: "match_making_report",
    manglik: "match_manglik_report",
    obstructions: "match_obstructions",
    dashakoot: "match_dashakoot_points"
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
      body: new URLSearchParams({
        m_day, m_month, m_year, m_hour, m_min, m_lat, m_lon, m_tzone,
        f_day, f_month, f_year, f_hour, f_min, f_lat, f_lon, f_tzone
      })
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Something went wrong", details: err.message });
  }
}
