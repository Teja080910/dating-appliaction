/* Usage: node scripts/build-map.js <lang>
 * Converts i18n/maps/<lang>.bykey.json (keyed by en.json slug) into
 * i18n/maps/<lang>.json (keyed by the exact English source text).
 */
const fs = require('fs');
const path = require('path');

const lang = process.argv[2];
if (!lang) {
  console.error('Usage: node scripts/build-map.js <lang>');
  process.exit(1);
}

const dir = path.join(__dirname, '..', 'i18n');
const en = JSON.parse(fs.readFileSync(path.join(dir, 'en.json'), 'utf8'));
const bykeyPath = path.join(dir, 'maps', `${lang}.bykey.json`);

if (!fs.existsSync(bykeyPath)) {
  console.error(`Missing authoring file: i18n/maps/${lang}.bykey.json`);
  process.exit(1);
}

const bykey = JSON.parse(fs.readFileSync(bykeyPath, 'utf8'));
const map = {};
const missing = [];
const unknown = [];
let issues = 0;

for (const [slug, enText] of Object.entries(en)) {
  if (Object.prototype.hasOwnProperty.call(bykey, slug)) {
    map[enText] = bykey[slug];
  } else {
    missing.push(`${slug} => ${enText}`);
  }
}

for (const slug of Object.keys(bykey)) {
  if (!Object.prototype.hasOwnProperty.call(en, slug)) {
    unknown.push(slug);
  }
}

fs.writeFileSync(
  path.join(dir, 'maps', `${lang}.json`),
  JSON.stringify(map, null, 2) + '\n'
);

console.log(
  `i18n/maps/${lang}.json: ${Object.keys(map).length}/${Object.keys(en).length} keys`
);
if (missing.length) {
  issues += missing.length;
  console.log(`\nMISSING SLUGS (${missing.length}):`);
  missing.forEach((m) => console.log('  ' + m));
}
if (unknown.length) {
  issues += unknown.length;
  console.log(`\nUNKNOWN SLUGS (${unknown.length}):`);
  unknown.forEach((m) => console.log('  ' + m));
}
process.exit(issues ? 1 : 0);
