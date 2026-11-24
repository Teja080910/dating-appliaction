/* Verifies every JSX text node / string prop in src is present in i18n/raw-inventory.json */
const fs = require('fs');
const path = require('path');

const inv = require('../i18n/raw-inventory.json');
const have = new Set(inv.items.map((i) => i.text.toLowerCase().replace(/\s+/g, ' ').trim()));

const ROOT = path.join(__dirname, '..', 'src');
const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {walk(p);}
    else if (/\.tsx$/.test(e.name)) {files.push(p);}
  }
})(ROOT);

const missing = [];
for (const file of files) {
  const rel = path.relative(path.join(__dirname, '..'), file);
  if (rel.replace(/\\/g, '/').startsWith('src/mock/')) {continue;}
  const src = fs.readFileSync(file, 'utf8');
  // Text between > and <
  for (const m of src.matchAll(/>([^<>{}]+)</g)) {
    const t = m[1].trim().replace(/\s+/g, ' ');
    if (!/[A-Za-zÀ-ɏ]{2,}/.test(t)) {continue;}
    if (/[;=`]|=>|&&|\|\||useState|useRef|useMemo|useCallback|\bconst\b|\breturn\b|\)\s*\]|\? \(/.test(t)) {continue;}
    if (/^\W/.test(t) && !/^\(/.test(t)) {continue;}
    if (!have.has(t.toLowerCase())) {missing.push({ rel, t });}
  }
  // placeholder="..." / label="..." attributes
  for (const m of src.matchAll(/\b(placeholder|label|title|buttonText)\s*=\s*"([^"]{2,80})"/g)) {
    const t = m[2].trim();
    if (!/[A-Za-zÀ-ɏ]{2,}/.test(t)) {continue;}
    if (!have.has(t.toLowerCase())) {missing.push({ rel, t });}
  }
}

const seen = new Set();
const uniq = missing.filter((m) => {
  const k = m.t.toLowerCase();
  if (seen.has(k)) {return false;}
  seen.add(k);
  return true;
});
console.log(`Missing ${uniq.length} strings:`);
uniq.forEach((m) => console.log(`  ${m.rel.split('/').pop()} | ${m.t.slice(0, 110)}`));
