const fs = require('fs');

let svg = fs.readFileSync('public/favicon.svg', 'utf8');
svg = svg.replace('viewBox="0 0 400 400"', 'viewBox="105 90 220 220"');
fs.writeFileSync('public/favicon.svg', svg);
