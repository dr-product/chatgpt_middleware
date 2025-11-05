import axios from "axios";

const SHEETBEST_BASE =
  "https://api.sheetbest.com/sheets/275d956b-81b3-48a5-b57d-79e7f0a1f826";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Only POST method allowed" });
    }

    const {
      tab,
      filters = {},
      limit = 1000,
      operation,
      vote_column,
      weight_type,
      zone,
    } = req.body;

    if (!tab) return res.status(400).json({ error: "Missing tab name" });

    let allRows = [];
    let offset = 0;

    while (true) {
      const params = new URLSearchParams({
        _limit: limit,
        _offset: offset,
        ...filters,
      });

      const response = await axios.get(
        `${SHEETBEST_BASE}/tabs/${tab}/search?${params.toString()}`
      );

      const data = response.data || [];
      allRows = allRows.concat(data);

      if (data.length < limit) break;
      offset += limit;
    }

    if (operation === "count") {
      return res.json({ count: allRows.length });
    }

    if (operation === "vote_share") {
      const votes = {};
      allRows.forEach((row) => {
        const party = (row[vote_column] || "Unspecified").trim();
        votes[party] = (votes[party] || 0) + 1;
      });

      const total = Object.values(votes).reduce((a, b) => a + b, 0);
      const summary = Object.entries(votes)
        .map(([party, count]) => ({
          party,
          share_pct: ((count / total) * 100).toFixed(1),
        }))
        .sort((a, b) => b.share_pct - a.share_pct);

      return res.json({
        zone: zone || "All",
        total_respondents: total,
        vote_column,
        summary,
      });
    }

    if (operation === "weights") {
      const weights = allRows.map((r) => ({
        submission_id: r.submission_id,
        total: r.total,
      }));
      return res.json({ count: weights.length, sample: weights.slice(0, 5) });
    }

    return res.json({
      message: "Operation complete",
      total_records: allRows.length,
      preview: allRows.slice(0, 5),
    });
  } catch (err) {
    console.error("Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
