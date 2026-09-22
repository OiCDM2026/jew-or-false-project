// Vercel's Upstash marketplace integration injects these under the legacy
// "KV_" names (kept for backward compatibility with the old Vercel KV product).
const REST_URL = process.env.KV_REST_API_URL;
const REST_TOKEN = process.env.KV_REST_API_TOKEN;

module.exports = async (req, res) => {
  const date = (req.query && req.query.date) || '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ error: 'Invalid date' });
    return;
  }

  if (!REST_URL || !REST_TOKEN) {
    res.status(500).json({ error: 'Storage not configured' });
    return;
  }

  try {
    const upstashRes = await fetch(
      REST_URL + '/hgetall/scores:' + encodeURIComponent(date),
      { headers: { Authorization: 'Bearer ' + REST_TOKEN } }
    );
    if (!upstashRes.ok) throw new Error('Upstash error ' + upstashRes.status);
    const data = await upstashRes.json();
    const flat = data.result || [];

    const counts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (let i = 0; i < flat.length; i += 2) {
      const k = Number(flat[i]);
      const v = Number(flat[i + 1]);
      if (Object.prototype.hasOwnProperty.call(counts, k)) counts[k] = v;
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    // This endpoint shows live counts; caching it (even briefly) is what
    // caused the very bug it exists to avoid — a player seeing themselves
    // undercounted because a cached response predates their own submission.
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ counts, total });
  } catch (e) {
    res.status(502).json({ error: 'Failed to fetch distribution' });
  }
};
