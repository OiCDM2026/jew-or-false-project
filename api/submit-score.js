const REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const { date, score } = body || {};

  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ error: 'Invalid date' });
    return;
  }
  const scoreNum = Number(score);
  if (!Number.isInteger(scoreNum) || scoreNum < 0 || scoreNum > 5) {
    res.status(400).json({ error: 'Invalid score' });
    return;
  }

  // Sanity check: only accept dates within a few days of the server's own
  // clock, to filter out obviously bogus submissions.
  const now = new Date();
  const submitted = new Date(date + 'T00:00:00Z');
  const diffDays = Math.abs((now - submitted) / 86400000);
  if (diffDays > 3) {
    res.status(400).json({ error: 'Date out of range' });
    return;
  }

  if (!REST_URL || !REST_TOKEN) {
    res.status(500).json({ error: 'Storage not configured' });
    return;
  }

  try {
    const upstashRes = await fetch(
      REST_URL + '/hincrby/scores:' + encodeURIComponent(date) + '/' + scoreNum + '/1',
      { headers: { Authorization: 'Bearer ' + REST_TOKEN } }
    );
    if (!upstashRes.ok) throw new Error('Upstash error ' + upstashRes.status);
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(502).json({ error: 'Failed to record score' });
  }
};
