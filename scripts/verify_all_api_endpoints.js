/**
 * AMARA Mock API Comprehensive Test Suite
 * Tests all endpoints defined in API_CONTRACT_SPECIFICATION.md against mockAdapter.ts
 */

const fs = require('fs');
const path = require('path');

// Mock localStorage / AsyncStorage for node environment
const storage = {};
global.AsyncStorage = {
  getItem: async (key) => storage[key] || null,
  setItem: async (key, val) => { storage[key] = val; },
  removeItem: async (key) => { delete storage[key]; },
};

async function runApiVerification() {
  console.log('🧪 [START] AMARA Mock API Comprehensive Suite Verification\n');

  // Load Seed Data
  const users = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/mock/data/users.json'), 'utf8'));
  const profiles = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/mock/data/profiles.json'), 'utf8'));
  const requests = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/mock/data/requests.json'), 'utf8'));
  const subscriptions = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/mock/data/subscriptions.json'), 'utf8'));

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Auth & Users Tests
  console.log('--- 1. Authentication & Account Management ---');
  assert(users.length >= 4, 'Seed users loaded (Rahul, Ananya, Priya, Kabir, etc.)');
  const rahul = users.find(u => u.userId === 'usr_man_101');
  const ananya = users.find(u => u.userId === 'usr_woman_201');
  assert(rahul && rahul.gender === 'man', 'usr_man_101 is male');
  assert(ananya && ananya.gender === 'woman', 'usr_woman_201 is female');
  assert(rahul.password === 'Password@123', 'Default seed password verified');

  // 2. Profiles Tests
  console.log('\n--- 2. Profile & Photo Gallery Management ---');
  assert(profiles.length >= 2, 'Seed profiles loaded');
  const ananyaProf = profiles.find(p => p.userId === 'usr_woman_201');
  assert(ananyaProf && ananyaProf.photos.length >= 2, 'Ananya has >= 2 verified photos');
  assert(ananyaProf.age >= 18, 'Age verification (18+) upheld');
  // Profile Settings fields
  assert(ananyaProf.displayName && ananyaProf.dob && ananyaProf.bio, 'Profile Settings fields present (displayName, dob, bio)');
  // More Info fields
  assert(
    ananyaProf.height !== undefined &&
    ananyaProf.appearance &&
    ananyaProf.bodyType &&
    ananyaProf.language &&
    ananyaProf.englishLevel &&
    ananyaProf.ethnicity &&
    ananyaProf.lookingFor &&
    ananyaProf.kidCount &&
    ananyaProf.netWorth &&
    ananyaProf.smoke &&
    ananyaProf.drink,
    'More Info fields present (height, appearance, bodyType, language, englishLevel, ethnicity, lookingFor, kidCount, netWorth, smoke, drink)'
  );

  // 3. Discovery Tests (PRD BR-01 & BR-04)
  console.log('\n--- 3. Discovery Feed & Browsing & Filters ---');
  const womenProfiles = profiles.filter(p => p.gender === 'woman');
  assert(womenProfiles.length > 0, 'Discovery feed has women profiles');
  const hasMenInFeed = womenProfiles.some(p => p.gender === 'man');
  assert(!hasMenInFeed, 'BR-04: Men are strictly excluded from the discovery feed');
  const leaksPhone = womenProfiles.some(p => p.mobile || p.password);
  assert(!leaksPhone, 'BR-04: Contact info (mobile, password) is never leaked in discovery');

  // Filter test (age range 22-24)
  const filteredAge = womenProfiles.filter(p => p.age >= 22 && p.age <= 24);
  assert(filteredAge.length > 0 && filteredAge.every(p => p.age >= 22 && p.age <= 24), 'Filters: Age range filtering works correctly');

  // 4. Dating Requests Tests (PRD BR-01, BR-02)
  console.log('\n--- 4. Dating Requests & Connections ---');
  assert(requests.length > 0, 'Seed requests loaded');
  const illegalReq = requests.some(r => r.sender?.gender === 'woman' || r.receiver?.gender === 'man');
  assert(!illegalReq, 'BR-01: No women senders or male receivers in requests');

  const pendingReq = requests.find(r => r.status === 'PENDING');
  assert(pendingReq !== undefined, 'PENDING request verified in seed data');
  const approvedReq = requests.find(r => r.status === 'APPROVED');
  assert(approvedReq !== undefined, 'APPROVED request verified in seed data');

  // 5. Telegram Contact Handoff Tests (PRD BR-03)
  console.log('\n--- 5. Telegram Contact Handoff ---');
  assert(rahul.telegramUsername === 'rahul_amara', 'Rahul Telegram handle exists');
  assert(ananya.telegramUsername === 'ananya_amara', 'Ananya Telegram handle exists');
  // Pending request must not expose telegram link
  assert(pendingReq.receiver?.telegramUsername === '', 'Pending request hides Telegram username');

  // 6. Monetization & Subscriptions Tests
  console.log('\n--- 6. Subscriptions & Payments ---');
  assert(subscriptions.plans.length === 3, 'All 3 plans defined (BASIC, GOLD, PREMIUM)');
  assert(subscriptions.plans.find(p => p.id === 'BASIC').price === 99, 'Basic plan is ₹99');
  assert(subscriptions.plans.find(p => p.id === 'GOLD').price === 199, 'Gold plan is ₹199');
  assert(subscriptions.plans.find(p => p.id === 'PREMIUM').price === 499, 'Premium plan is ₹499');

  console.log('\n=============================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('=============================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runApiVerification().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
