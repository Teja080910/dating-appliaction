/* Extracts user-facing strings from src/** and builds i18n/raw-inventory.json */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'src');
const OUT = path.join(__dirname, '..', 'i18n');

const SKIP_FILES = [
  'src/mock/',
  'src/utils/languageHelper.ts',
  'src/utils/types/',
  'src/api/',
  'src/environment/',
  'src/utils/session.ts',
  'src/utils/sessionState.ts',
  'src/utils/sessionHelper.ts',
];

const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {walk(p);}
    else if (/\.(tsx|ts)$/.test(e.name) && !/\.d\.ts$/.test(e.name)) {files.push(p);}
  }
})(ROOT);

const UI_PROPS = [
  'title', 'label', 'placeholder', 'description', 'message', 'subtitle', 'text',
  'buttonText', 'header', 'heading', 'caption', 'hint', 'text1', 'text2',
  'confirmText', 'cancelText', 'okText', 'leftTitle', 'rightTitle', 'emptyTitle',
  'emptyMessage', 'tabLabel', 'errorMessage', 'successMessage', 'question', 'answer', 'tag',
];

const STR = '\'(?:\\\\.|[^\'\\\\])*\'|"(?:\\\\.|[^"\\\\])*"';
const DQ = '"(?:\\\\.|[^"\\\\])*"';
const results = [];
const rel = (f) => path.relative(path.join(__dirname, '..'), f).replace(/\\/g, '/');

const push = (file, src, idx, kind, text) => {
  if (typeof text !== 'string') {return;}
  const t = text.trim().replace(/\s+/g, ' ');
  if (!t) {return;}
  if (!/[A-Za-zÀ-ɏ]/.test(t)) {return;}
  if (t.length > 1500) {return;}
  results.push({ file: rel(file), line: src.slice(0, idx).split('\n').length, kind, text: t });
};

const unq = (s) =>
  typeof s === 'string' ? s.slice(1, -1).replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\n/g, ' ') : '';

// Replace {..} / ${..} groups with {name} placeholders when they hold a simple expression
const withPlaceholders = (s) => {
  let out = '';
  let i = 0;
  while (i < s.length) {
    const dollar = s[i] === '$' && s[i + 1] === '{';
    if (s[i] === '{' || dollar) {
      const start = dollar ? i + 1 : i;
      let depth = 0;
      let j = start;
      for (; j < s.length; j++) {
        if (s[j] === '{') {depth++;}
        else if (s[j] === '}') {
          depth--;
          if (depth === 0) {break;}
        }
      }
      const expr = s.slice(start + 1, j).trim();
      let keep;
      if (/^'[^']*'$|^"[^"]*"$/.test(expr)) {
        const content = expr.slice(1, -1).replace(/\\n|\\t|\\r/g, ' ');
        keep = content.trim() === '' ? ' ' : ''; // whitespace literal -> space, other literal -> drop
      } else if (/^\d+$/.test(expr)) {keep = '';}
      else if (/^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*$/.test(expr)) {keep = `{${expr.split('.').pop()}}`;}
      else {
        const id = expr.match(/[A-Za-z_$][\w$]*/); // complex expr -> first identifier
        keep = id ? `{${id[0]}}` : '';
      }
      out += keep;
      i = j + 1;
    } else {
      out += s[i++];
    }
  }
  return out;
};

for (const file of files) {
  const relFile = rel(file);
  if (SKIP_FILES.some((s) => relFile.startsWith(s))) {continue;}

  const src = fs.readFileSync(file, 'utf8');
  const code = src.replace(/^\s*(import|export)\s.*$/gm, '');

  // 1. JSX literal text between > and <
  for (const m of code.matchAll(/>([^<>]+)</g)) {
    const before = code[m.index - 1] || '';
    if (before === '=' || before === '-' || before === '>' || before === '!') {continue;}
    const literal = withPlaceholders(m[1]).trim();
    if (/[;=`]|=>|&&|\|\|| \? /.test(literal)) {continue;}
    if (/\?\s*\($/.test(literal) || /^\s*:/.test(literal)) {continue;}
    if (!literal.replace(/\{[^{}]*\}/g, '').trim()) {continue;} // only an expression, no visible text
    if (!/[A-Za-zÀ-ɏ]{2,}/.test(literal.replace(/\{[^{}]*\}/g, ''))) {continue;} // needs real words
    if (/^[}\])>,.:;-]/.test(literal)) {continue;}
    push(file, src, m.index + 1, 'jsx', literal);
  }

  // 2. UI props as object keys (value may be on next line)
  for (const p of UI_PROPS) {
    const re = new RegExp(`\\b${p}\\s*:\\s*(?:\\/\\/[^\\n]*\\n\\s*)?(${STR})`, 'g');
    for (const m of code.matchAll(re)) {push(file, src, m.index, `prop:${p}`, unq(m[1]));}
    // 3. UI props as JSX attributes: placeholder="..." / title='...'
    const are = new RegExp(`\\b${p}(?![\\w-])\\s*=\\s*(${DQ}|'(?:\\\\.|[^'\\\\])*')`, 'g');
    for (const m of code.matchAll(are)) {push(file, src, m.index, `attr:${p}`, unq(m[1]));}
  }

  // 4. alert('Title', 'Message')
  for (const m of code.matchAll(/(?:Alert\.)?alert\(\s*(${STR})\s*,\s*(${STR})/g)) {
    push(file, src, m.index, 'alert:title', unq(m[1]));
    push(file, src, m.index, 'alert:message', unq(m[2]));
  }

  // 4b. message-ish function calls: fn('text') / fn(err, 'fallback text')
  for (const m of code.matchAll(
    /\b(getUserFriendlyMessage|getUserFriendlyTitle|showError|showToast|showMessage|notify|showSuccess|showWarning|confirm|prompt)\(([^;\n]{0,300}?)\)/g
  )) {
    const args = m[2] || '';
    for (const s of args.match(new RegExp(STR, 'g')) || []) {push(file, src, m.index, 'fnmsg', unq(s));}
  }

  // 4c. label/title variable assignments: label = 'Discover'
  for (const m of code.matchAll(
    new RegExp(`\\b(label|title|text|message|subtitle|placeholder|heading|caption|description)\\s*=\\s*(${STR})`, 'g')
  )) {
    push(file, src, m.index, `assign:${m[1]}`, unq(m[2]));
  }

  // 5. ternary strings
  for (const m of code.matchAll(new RegExp(`\\?\\s*(${STR})\\s*:\\s*(${STR})`, 'g'))) {
    push(file, src, m.index, 'ternary:a', unq(m[1]));
    push(file, src, m.index, 'ternary:b', unq(m[2]));
  }

  // 6. option arrays
  for (const m of code.matchAll(new RegExp(`\\[\\s*(${STR}(?:\\s*,\\s*${STR})+)\\s*\\]`, 'g'))) {
    for (const s of m[1].match(new RegExp(STR, 'g'))) {push(file, src, m.index, 'array', unq(s));}
  }

  // 7. || / ?? fallback strings
  for (const m of code.matchAll(new RegExp(`(?:\\|\\||\\?\\?)\\s*(${STR})`, 'g'))) {
    push(file, src, m.index, 'fallback', unq(m[1]));
  }

  // 8. template literals -> {identifier}
  for (const m of code.matchAll(/`([^`]+)`/g)) {
    const tpl = m[1];
    if (tpl.length > 600) {continue;}
    const converted = withPlaceholders(tpl.replace(/\r?\n/g, ' '));
    if (converted.includes('${')) {continue;}
    const literalOnly = converted.replace(/\{[^{}]*\}/g, ' ');
    if (/[;=`]|=>/.test(literalOnly)) {continue;}
    if (!/[A-Za-zÀ-ɏ]{2,}/.test(literalOnly)) {continue;} // needs real words outside placeholders
    if (/^[}\])>,.:;-]/.test(converted.trim())) {continue;}
    push(file, src, m.index, 'tpl', converted);
  }
}

/* ---------------- noise filters ---------------- */
const isNoise = (t) => {
  if (/^#|^rgba?\(|^hsla?\(|^transparent$/i.test(t)) {return true;}
  if (/^https?:\/\//i.test(t) || /^tg:\/\//i.test(t) || /^\//.test(t)) {return true;}
  if (/\.(png|jpe?g|svg|webp|mp4|json|ttf)$/i.test(t)) {return true;}
  if (/^(true|false|null|undefined|N\/A)$/i.test(t)) {return true;}
  if (/^[a-z0-9_@-]+$/.test(t)) {return true;} // ids, enums, slugs, keys
  if (/^[a-z]+[A-Z][A-Za-z0-9]*$/.test(t)) {return true;} // camelCase identifiers
  if (/^\d+(\.\d+)?$/.test(t)) {return true;}
  if (/^[;,=[\]@$]/.test(t) && !/[A-Za-zÀ-ɏ]{2,}/.test(t)) {return true;}
  if (/^\[/.test(t)) {return true;} // debug log prefixes
  if (/^[}\])>,.:;-]/.test(t)) {return true;}
  if (/\{\s*(const|let|var|return|if|else|function|new|await|this|import|export|typeof)\b/.test(t)) {return true;}
  if (/\)\s*\{/.test(t)) {return true;}
  if (/\{APIURL\}|\/profile\/|\/auth\/|\/privacy\/|\/dashboard\//.test(t)) {return true;}
  if (/^(light-content|dark-content|center|left|right|top|bottom|row|column|contain|cover|none|blur|solid|dashed|android|ios|dev|test)$/.test(t)) {return true;}
  if (/password@\d|usr_|sess_|mock|Bearer /i.test(t)) {return true;}
  if (/[^<>=!]=[^=]/.test(t)) {return true;} // code assignment
  if (/^(image|application)\/[\w.+-]+$/.test(t)) {return true;}
  if (/@(example|gmail)\.com$/i.test(t)) {return true;}
  if (/^(DD|MM|YYYY|HH|MM|SS)$/.test(t)) {return true;}
  if (/^[A-Za-z]$/.test(t)) {return true;}
  if (/\b[A-Za-z]+-[A-Za-z]*\{/.test(t)) {return true;} // id-like templates
  if (/[-_]\{/.test(t)) {return true;}
  if (t === ',' || /^,\s*\{/.test(t)) {return true;}
  return false;
};

const cleaned = results.filter((r) => !isNoise(r.text));

const map = new Map();
for (const r of cleaned) {
  const key = r.text.toLowerCase();
  if (map.has(key)) {
    const item = map.get(key);
    item.count += 1;
    if (!item.files.includes(r.file)) {item.files.push(r.file);}
    continue;
  }
  map.set(key, { ...r, count: 1, files: [r.file] });
}

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(
  path.join(OUT, 'raw-inventory.json'),
  JSON.stringify({ count: map.size, items: [...map.values()] }, null, 2)
);
console.log(`Extracted ${map.size} unique strings (raw ${results.length} matches)`);
