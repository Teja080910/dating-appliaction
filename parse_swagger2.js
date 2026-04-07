const fs = require('fs');
const data = JSON.parse(fs.readFileSync('live_v3.json', 'utf8'));

console.log("== ALL GET ENDPOINTS ==");
Object.keys(data.paths).forEach(p => {
    if (data.paths[p].get) console.log(p);
});

console.log("\n== PUT /profile/update-details ==");
console.log(JSON.stringify(data.paths['/profile/update-details']?.put?.parameters || [], null, 2));

console.log("\n== PUT /profile/update-basic ==");
console.log(JSON.stringify(data.paths['/profile/update-basic']?.put?.parameters || [], null, 2));

console.log("\n== POST /razorpay/create-order ==");
console.log(JSON.stringify(data.paths['/razorpay/create-order']?.post?.parameters || [], null, 2));
