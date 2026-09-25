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

// Manual overrides, by date key: statement ids to use instead of running the
// live algorithm, in display order. Puzzle numbering launched on 2026-09-22,
// making 2026-09-23 the first day "Puzzle #2" ever existed. In that same
// window, two follow-up changes (the 30-day no-repeat logic, and three new
// content batches growing the bank) shifted what the live algorithm computes
// for that date away from the set that was actually shown and discussed
// during launch testing. Pinning it here keeps that specific date on the
// original launch-week content rather than whatever the algorithm would
// produce today.
const OVERRIDES = {
  '2026-09-23': ['s0461', 's0042', 's0122', 's0424', 's0002'],
};

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

function isEasy(s) { return s.difficulty <= 2; }
function isMedium(s) { return s.difficulty === 3; }
function isHard(s) { return s.difficulty >= 4; }

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
    // Shuffle each category's pool once, up front, so every pick below for
    // this day (tier-guarantee picks and the fill-in picks after) draws
    // from the same fixed, already-randomized order.
    const shuffledPools = {};
    categories.forEach(cat => { shuffledPools[cat] = shuffleWithRng(byCategory[cat], rng); });

    const picked = [];
    const usedToday = new Set();
    const usedCategories = new Set();

    // requireFreshCategory: true tries to keep the 5 picks spread across
    // different categories (matching the original design); false allows
    // reusing a category once every fresh one has been tried and failed.
    function tryPick(tierCheck, requireFreshCategory) {
      for (const cat of categories) {
        if (requireFreshCategory && usedCategories.has(cat)) continue;
        const choice = shuffledPools[cat].find(s =>
          tierCheck(s) && !excluded.has(statementGroupKey(s)) && !usedToday.has(statementGroupKey(s))
        );
        if (choice) { picked.push(choice); usedToday.add(statementGroupKey(choice)); usedCategories.add(cat); return true; }
      }
      return false;
    }
    // Last resort: ignore the 30-day exclusion window (only matters if a
    // tier is running low on fresh options, e.g. a very small bank).
    function tryPickRelaxed(tierCheck) {
      for (const cat of categories) {
        const choice = shuffledPools[cat].find(s => tierCheck(s) && !usedToday.has(statementGroupKey(s)));
        if (choice) { picked.push(choice); usedToday.add(statementGroupKey(choice)); usedCategories.add(cat); return true; }
      }
      return false;
    }

    // Guarantee at least one Easy, one Medium, one Hard statement — order
    // shuffled per day so no tier always gets first pick of fresh categories.
    shuffleWithRng([isEasy, isMedium, isHard], rng).forEach(tierCheck => {
      tryPick(tierCheck, true) || tryPick(tierCheck, false) || tryPickRelaxed(tierCheck);
    });

    // Fill the remaining slots with any difficulty, still preferring
    // categories not already used today.
    const anyTier = () => true;
    while (picked.length < 5) {
      if (tryPick(anyTier, true)) continue;
      if (tryPick(anyTier, false)) continue;
      if (tryPickRelaxed(anyTier)) continue;
      break; // bank too small to fill further — never happens at current size
    }

    history.push(picked.map(statementGroupKey));
    todaysPicks = picked;
    cursor = addDays(cursor, 1);
  }

  // Selection (above) is unaffected by display order — only the final day's
  // picks are sorted, easiest to hardest, for the actual puzzle sequence.
  return todaysPicks.slice().sort((a, b) => a.difficulty - b.difficulty);
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

  const byId = {};
  STATEMENTS.forEach(s => { byId[s.id] = s; });
  const picks = OVERRIDES[date]
    ? OVERRIDES[date].map(id => byId[id]).filter(Boolean)
    : computeStatementsForKey(date);

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
