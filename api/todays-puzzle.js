// Pins each date's 5 statements in Redis the first time anyone requests
// that date, then serves that same pinned result to every device forever
// after — regardless of any statement-bank growth or algorithm change made
// afterward. Without this, "today's puzzle" was a pure live recomputation
// from the CURRENT statements.json + CURRENT algorithm on every request, so
// adding new statements (or tweaking selection logic) could retroactively
// change what an already-launched day's puzzle was, causing different
// devices to see different content for the same calendar date depending on
// when they last computed it.
//
// The selection algorithm below must stay in sync with getTodaysStatements()
// in index.html (this is a server-side port of the same deterministic logic,
// parameterized by an arbitrary target date rather than always "today").
const STATEMENTS = require('../statements.json');

const REST_URL = process.env.KV_REST_API_URL;
const REST_TOKEN = process.env.KV_REST_API_TOKEN;

const EPOCH = new Date('2026-09-22T00:00:00Z'); // launch day = Puzzle #1
const NO_REPEAT_DAYS = 30;

function dateFromKey(k) {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function keyFromDate(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function addDays(d, n) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}
function dayNumberForKey(k) {
  const [y, m, dd] = k.split('-').map(Number);
  const utcDay = Date.UTC(y, m - 1, dd);
  const diff = Math.floor((utcDay - EPOCH.getTime()) / 86400000);
  return diff + 1;
}
function seedFromDateKey(key) {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  return h;
}
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffleWithRng(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function statementGroupKey(s) {
  return s.pairId != null ? ('p' + s.pairId) : ('s' + s.id);
}

function computeStatementsForKey(targetKey) {
  const byCategory = {};
  STATEMENTS.forEach(s => {
    (byCategory[s.category] = byCategory[s.category] || []).push(s);
  });

  const totalDays = dayNumberForKey(targetKey);
  const history = [];
  let cursor = new Date(EPOCH);
  let todaysPicks = [];

  for (let dayIdx = 1; dayIdx <= totalDays; dayIdx++) {
    const dKey = keyFromDate(cursor);
    const rng = mulberry32(seedFromDateKey(dKey));

    const excluded = new Set();
    const windowStart = Math.max(0, history.length - NO_REPEAT_DAYS);
    for (let i = windowStart; i < history.length; i++) {
      history[i].forEach(gk => excluded.add(gk));
    }

    const categories = shuffleWithRng(Object.keys(byCategory), rng);
    const picked = [];
    const usedToday = new Set();

    for (const cat of categories) {
      if (picked.length >= 5) break;
      const pool = shuffleWithRng(byCategory[cat], rng);
      const choice = pool.find(s => !excluded.has(statementGroupKey(s)) && !usedToday.has(statementGroupKey(s)));
      if (!choice) continue;
      picked.push(choice);
      usedToday.add(statementGroupKey(choice));
    }
    if (picked.length < 5) {
      for (const cat of categories) {
        if (picked.length >= 5) break;
        const pool = shuffleWithRng(byCategory[cat], rng);
        const choice = pool.find(s => !usedToday.has(statementGroupKey(s)));
        if (choice) { picked.push(choice); usedToday.add(statementGroupKey(choice)); }
      }
    }

    history.push(picked.map(statementGroupKey));
    todaysPicks = picked;
    cursor = addDays(cursor, 1);
  }

  return todaysPicks;
}

module.exports = async (req, res) => {
  const date = (req.query && req.query.date) || '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ error: 'Invalid date' });
    return;
  }

  res.setHeader('Cache-Control', 'no-store');

  const redisKey = 'puzzle:' + date;

  if (REST_URL && REST_TOKEN) {
    try {
      const getRes = await fetch(REST_URL + '/get/' + encodeURIComponent(redisKey), {
        headers: { Authorization: 'Bearer ' + REST_TOKEN },
      });
      if (getRes.ok) {
        const getData = await getRes.json();
        if (getData.result) {
          res.status(200).json(JSON.parse(getData.result));
          return;
        }
      }
    } catch (e) {
      // Fall through to live computation below.
    }
  }

  const picks = computeStatementsForKey(date);

  if (REST_URL && REST_TOKEN) {
    try {
      const body = JSON.stringify(picks);
      // NX: only pin if nothing is stored yet — avoids a race where two
      // near-simultaneous first requests for the same new date could
      // otherwise overwrite each other with two independently-shuffled
      // (but individually valid) results.
      await fetch(REST_URL + '/set/' + encodeURIComponent(redisKey) + '/' + encodeURIComponent(body) + '/NX', {
        headers: { Authorization: 'Bearer ' + REST_TOKEN },
      });
    } catch (e) {
      // Non-fatal: today's response is still correct, just not persisted.
    }
  }

  res.status(200).json(picks);
};
