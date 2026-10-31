/* Usage: node scripts/apply-i18n.js <lang>
 * Builds i18n/<lang>.json from i18n/en.json + i18n/maps/<lang>.json
 * The map is keyed by the exact English source text.
 */
const fs = require('fs');
const path = require('path');

const lang = process.argv[2];
if (!lang) {
  console.error('Usage: node scripts/apply-i18n.js <lang>');
  process.exit(1);
}

const dir = path.join(__dirname, '..', 'i18n');
const en = require(path.join(dir, 'en.json'));
const mapPath = path.join(dir, 'maps', `${lang}.json`);

if (!fs.existsSync(mapPath)) {
  console.error(`Missing translation map: i18n/maps/${lang}.json`);
  process.exit(1);
}

const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
const out = {};
const missing = [];
const unknown = [];

for (const [key, enText] of Object.entries(en)) {
  if (Object.prototype.hasOwnProperty.call(map, enText)) {
    out[key] = map[enText];
  } else {
    missing.push(`${key} => ${enText}`);
  }
}

for (const k of Object.keys(map)) {
  if (!Object.values(en).includes(k)) {
    unknown.push(k);
  }
}

// placeholder sanity: every {token} in English must survive in translation
const placeholderIssues = [];
for (const [key, text] of Object.entries(out)) {
  const src = en[key];
  const want = [...src.matchAll(/\{[^{}]*\}/g)].map((m) => m[0]);
  const got = new Set([...text.matchAll(/\{[^{}]*\}/g)].map((m) => m[0]));
  for (const w of want) {
    if (!got.has(w)) {
      placeholderIssues.push(`${key}: missing ${w}`);
    }
  }
}

fs.writeFileSync(path.join(dir, `${lang}.json`), JSON.stringify(out, null, 2) + '\n');

console.log(`i18n/${lang}.json: ${Object.keys(out).length}/${Object.keys(en).length} keys`);
if (missing.length) {
  console.log(`\nMISSING (${missing.length}):`);
  missing.forEach((m) => console.log('  ' + m));
}
if (unknown.length) {
  console.log(`\nNOT IN en.json (${unknown.length}):`);
  unknown.forEach((m) => console.log('  ' + m));
}
if (placeholderIssues.length) {
  console.log(`\nPLACEHOLDER ISSUES (${placeholderIssues.length}):`);
  placeholderIssues.forEach((m) => console.log('  ' + m));
}
process.exit(missing.length || unknown.length || placeholderIssues.length ? 1 : 0);
