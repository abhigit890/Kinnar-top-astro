function getUtcOffset(timeZone, date = new Date()) {
  try {
    const dtf = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "shortOffset" });
    const parts = dtf.formatToParts(date);
    const offsetPart = parts.find(p => p.type === "timeZoneName").value;
    const match = offsetPart.match(/GMT([+-])(\d+)(?::(\d+))?/);
    if (!match) return 5.5;
    const sign = match[1] === "-" ? -1 : 1;
    const hours = parseInt(match[2], 10);
    const minutes = match[3] ? parseInt(match[3], 10) : 0;
    return sign * (hours + minutes / 60);
  } catch (e) {
    return 5.5;
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const place = body?.place || req.query?.place;
  if (!place) return res.status(400).json({ error: "Place name is required", received: body });

  const maxRows = body?.suggest ? "6" : "1";

  try {
    const response = await fetch("https://json.astrologyapi.com/v1/geo_details", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept-Language": "en",
        "x-astrologyapi-key": process.env.ASTROLOGY_API_KEY
      },
      body: new URLSearchParams({ place: place, maxRows })
    });
    const data = await response.json();
    const list = data?.geonames || [];
    if (!list.length) return res.status(404).json({ error: "Place not found" });

    const results = list.map(geo => ({
      place_name: geo.place_name,
      lat: parseFloat(geo.latitude),
      lon: parseFloat(geo.longitude),
      timezone_id: geo.timezone_id,
      tzone: getUtcOffset(geo.timezone_id)
    }));

    if (body?.suggest) {
      return res.status(200).json({ results });
    }
    res.status(200).json(results[0]);
  } catch (err) {
    res.status(500).json({ error: "Something went wrong", details: err.message });
  }
}
