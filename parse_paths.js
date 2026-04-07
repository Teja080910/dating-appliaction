const fs = require('fs');
const data = JSON.parse(fs.readFileSync('live_v3.json', 'utf8'));
console.log(Object.keys(data.paths).join('\n'));
