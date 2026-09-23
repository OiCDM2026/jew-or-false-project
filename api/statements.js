// Serving this from a serverless function rather than as a static file is
// deliberate: Vercel's CDN applies its own aggressive edge-caching to
// static assets that a Cache-Control: no-store response header doesn't
// reliably override, which caused different edge nodes (e.g. mobile vs
// desktop traffic on different networks) to serve genuinely different,
// stale snapshots of the statement bank at the same computed date.
// Serverless function responses aren't edge-cached by default, so this
// header actually holds.
const statements = require('../statements.json');

module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json(statements);
};
