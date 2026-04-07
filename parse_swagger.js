const fs = require('fs');
const data = JSON.parse(fs.readFileSync('live_v3.json', 'utf8'));
console.log("== PATHS ==");
const paths = Object.keys(data.paths);
for(let p of paths) {
    if (p.toLowerCase().includes('plan') || p.toLowerCase().includes('sub') || p.toLowerCase().includes('razorpay') || p.toLowerCase().includes('profile')) {
        console.log(p);
        console.log(Object.keys(data.paths[p]));
    }
}
