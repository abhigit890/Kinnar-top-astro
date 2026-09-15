export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

  const { action, day, month, year, hour, min, lat, lon, tzone, chartId, chartStyle } = req.body;

  const KEY = process.env.ASTROLOGY_API_KEY;
  const BASE = "https://json.astrologyapi.com/v1";
  const commonBody = { day, month, year, hour, min, lat, lon, tzone };

  async function callApi(path, extra = {}) {
    const r = await fetch(`${BASE}/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept-Language": "en",
        "x-astrologyapi-key": KEY
      },
      body: new URLSearchParams({ ...commonBody, ...extra })
    });
    return r.json();
  }

  if (action === "panchang") {
    if (!day || !month || !year || hour === undefined || min === undefined || !lat || !lon || !tzone) {
      return res.status(400).json({ error: "Missing panchang details" });
    }
    try {
      return res.status(200).json(await callApi("advanced_panchang/sunrise"));
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (action === "chaughadiya") {
    if (!day || !month || !year || hour === undefined || min === undefined || !lat || !lon || !tzone) {
      return res.status(400).json({ error: "Missing chaughadiya details" });
    }
    try {
      return res.status(200).json(await callApi("chaughadiya_muhurta"));
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (action === "festival") {
    if (!day || !month || !year || hour === undefined || min === undefined || !lat || !lon || !tzone) {
      return res.status(400).json({ error: "Missing festival details" });
    }
    try {
      return res.status(200).json(await callApi("panchang_festival"));
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (action === "tarot") {
    const { love, career, finance } = req.body;
    if (!love || !career || !finance) {
      return res.status(400).json({ error: "Missing tarot card numbers" });
    }
    try {
      const r = await fetch(`${BASE}/tarot_predictions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept-Language": "en",
          "x-astrologyapi-key": KEY
        },
        body: new URLSearchParams({ love, career, finance })
      });
      return res.status(200).json(await r.json());
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (action === "hora") {
    if (!day || !month || !year || hour === undefined || min === undefined || !lat || !lon || !tzone) {
      return res.status(400).json({ error: "Missing hora details" });
    }
    try {
      return res.status(200).json(await callApi("hora_muhurta"));
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (action === "panchangchart") {
    if (!day || !month || !year || hour === undefined || min === undefined || !lat || !lon || !tzone) {
      return res.status(400).json({ error: "Missing panchangchart details" });
    }
    try {
      return res.status(200).json(await callApi("panchang_chart/sunrise"));
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (action === "monthpanchang") {
    if (!day || !month || !year || hour === undefined || min === undefined || !lat || !lon || !tzone) {
      return res.status(400).json({ error: "Missing monthpanchang details" });
    }
    try {
      return res.status(200).json(await callApi("tamil_month_panchang"));
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (action === "monthsuntimes") {
    if (!day || !month || !year || hour === undefined || min === undefined || !lat || !lon || !tzone) {
      return res.status(400).json({ error: "Missing monthsuntimes details" });
    }
    try {
      return res.status(200).json(await callApi("monthly_panchang"));
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (!day || !month || !year || hour === undefined || min === undefined || !lat || !lon || !tzone) {
    return res.status(400).json({ error: "Missing birth details" });
  }

  try {
    switch (action) {
      case "kundli":
        return res.status(200).json(await callApi("natal_chart_interpretation", { house_type: "placidus" }));

      case "extended":
        return res.status(200).json(await callApi("planets/extended"));

      case "dasha":
        return res.status(200).json(await callApi("current_vdasha_all"));

      case "chart": {
        if (!chartId) return res.status(400).json({ error: "Missing chartId" });
        const allowed = ["D1","D2","D3","D4","D5","D7","D8","D9","D10","D12","D16","D20","D24","D27","D30","D40","D45","D60"];
        if (!allowed.includes(chartId)) return res.status(400).json({ error: "Invalid chartId" });
        const data = await callApi(`horo_chart_image/${chartId}`, { chartType: chartStyle === "south" ? "south" : "north" });
        return res.status(200).json({ svg: data.svg || null });
      }

      case "chartPlanets": {
        if (!chartId) return res.status(400).json({ error: "Missing chartId" });
        const allowed = ["D1","D2","D3","D4","D5","D7","D8","D9","D10","D12","D16","D20","D24","D27","D30","D40","D45","D60"];
        if (!allowed.includes(chartId)) return res.status(400).json({ error: "Invalid chartId" });
        const data = await callApi(`horo_chart/${chartId}`);
        return res.status(200).json({ signs: data });
      }

      case "birthdetails":
        return res.status(200).json(await callApi("birth_details"));

      case "ashtakvarga": {
        const raw = await callApi("sarvashtak");
        const points = raw.ashtak_points || {};
        const sarvashtak = {};
        Object.keys(points).forEach(sign => { sarvashtak[sign] = points[sign].total; });
        return res.status(200).json({ sarvashtak });
      }

      case "shadbala":
        return res.status(200).json(await callApi("shadbala"));

      case "planetnature":
        return res.status(200).json(await callApi("planet_nature"));

      case "rashireport": {
        const planets = ["sun","moon"];
        const results = await Promise.all(planets.map(p => callApi(`general_rashi_report/${p}`)));
        const report = {};
        planets.forEach((p,i) => { report[p] = results[i] && results[i].rashi_report; });
        return res.status(200).json(report);
      }

      case "kp":
        return res.status(200).json(await callApi("kp_planets"));

      case "kphouses":
        return res.status(200).json(await callApi("kp_house_cusps"));

      case "kpbirthchart":
        return res.status(200).json(await callApi("kp_birth_chart"));

      case "kpsignificators":
        return res.status(200).json(await callApi("kp_house_significator"));

      case "kpplanetsignificators":
        return res.status(200).json(await callApi("kp_planet_significator"));

      default:
        return res.status(400).json({ error: "Unknown action" });
    }
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong", details: err.message });
  }
}
