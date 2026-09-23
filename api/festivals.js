// See api/statements.js for why this is a function rather than a static
// file — the same edge-caching issue applies here.
const festivals = require('../festivals.json');

module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json(festivals);
};
