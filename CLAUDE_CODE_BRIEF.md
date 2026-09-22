# Jew or False — project brief

Paste this whole file as your first message to Claude Code so it has full context.

## What this is
A daily Wordle-style true/false game: 5 statements about Jewish life, tradition
and history per day, same 5 for everyone on a given date. Players guess Jew
(true) or False for each, see an explanation after each answer, then get a
score out of 5, an emoji grid, and a share button — plus a running streak.

## Current state
- `index.html` — the whole working game (HTML/CSS/JS, no build step, no
  dependencies). Statements are currently embedded directly in the page as a
  JS array.
- `statements.json` — the same statement bank as standalone JSON (105
  statements, ~50/50 true/false, tagged with category, isTrue, and an
  explanation shown after answering). Currently only `index.html`'s embedded
  copy is actually used by the game; `statements.json` is the source of truth
  going forward.
- Daily selection: the date is used to seed a deterministic pick of 5
  statements (one per category where possible), so everyone gets the same 5
  on the same day.
- Streak and per-player stats are stored in `localStorage` only — nothing
  server-side yet.
- There's a donation link ("Help my beigel fund 🥯") at the bottom of the
  results screen pointing to https://buymeacoffee.com/jeworfalse.

## What's next (in rough priority order)
1. **Move `index.html` to load `statements.json` at runtime** instead of the
   embedded copy, so the statement bank can grow without editing the page.
2. **Grow the statement bank toward ~10,000 statements**, fact-checked in
   batches, keeping the true/false pattern where the false version changes
   exactly one fact from a true statement (see existing pairs in
   `statements.json` for the pattern, via the `pairId` field).
3. **Global ranking / "you scored better than X% of players today"** — this
   needs a real backend, which is the main reason we're moving here. A
   lightweight approach: a serverless function (Vercel/Netlify function or
   Supabase) that accepts `{date, score}` POSTs and returns the day's score
   distribution so far. Free tier is fine at this scale.
4. **Deploy** to Vercel or Netlify with a custom domain.
5. Revisit the name/branding once there's real traffic — worth a gut check
   with a few people outside the joke before wider launch, since it plays on
   a sensitive subject (Judaism) via a pun.

## Notes on tone
Statements and explanations should stay factual and neutral — no jokes at
the expense of the subject matter, keep language plain and accurate. Watch
for statements where practice varies by denomination (Orthodox/Conservative/
Reform) and either avoid those or note the variation.
