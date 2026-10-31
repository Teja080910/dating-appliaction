/* Usage: node scripts/check-i18n-literals.js
 * Reports English strings from i18n/en.json that still appear as hardcoded
 * literals in src/ (i.e. not yet routed through t()).
 */
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');

const ROOT = path.join(__dirname, '..');
const en = require(path.join(ROOT, 'i18n/en.json'));
const SKIP_KEYS = new Set([
  'loc', 'start', 'end', 'range', 'extra',
  'leadingComments', 'trailingComments', 'innerComments', 'comments',
]);

const texts = new Set(Object.values(en));

function* walkSrc(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === '__mocks__') {
        continue;
      }
      yield* walkSrc(p);
    } else if (/\.(tsx?|jsx?|js)$/.test(entry.name)) {
      yield p;
    }
  }
}

const leftovers = [];
for (const abs of walkSrc(path.join(ROOT, 'src'))) {
  const rel = path.relative(ROOT, abs);
  const code = fs.readFileSync(abs, 'utf8');
  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: 'module',
      plugins: [
        abs.endsWith('.tsx') ? 'jsx' : null,
        abs.endsWith('.ts') || abs.endsWith('.tsx') ? 'typescript' : null,
        'jsx',
        'typescript',
      ].filter(Boolean),
      errorRecovery: true,
    });
  } catch {
    continue;
  }
  const stack = [ast.program];
  while (stack.length) {
    const node = stack.pop();
    if (!node || typeof node.type !== 'string') {
      continue;
    }
    let hit = null;
    if (node.type === 'StringLiteral' && texts.has(node.value)) {
      hit = node.value;
    } else if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
      const cooked = node.quasis[0].value.cooked;
      if (texts.has(cooked)) {
        hit = cooked;
      }
    } else if (node.type === 'JSXText' && texts.has(node.value.trim()) && node.value.trim()) {
      hit = node.value.trim();
    }
    if (hit) {
      leftovers.push({ file: rel, line: node.loc ? node.loc.start.line : '?', text: hit });
    }
    for (const key of Object.keys(node)) {
      if (SKIP_KEYS.has(key)) {
        continue;
      }
      const child = node[key];
      if (Array.isArray(child)) {
        for (const c of child) {
          stack.push(c);
        }
      } else if (child && typeof child.type === 'string') {
        stack.push(child);
      }
    }
  }
}

if (leftovers.length === 0) {
  console.log('OK: no hardcoded en.json strings remain in src/');
} else {
  console.log(`LEFTOVERS (${leftovers.length}):`);
  for (const l of leftovers) {
    console.log(`  ${l.file}:${l.line}  ${JSON.stringify(l.text).slice(0, 90)}`);
  }
  process.exitCode = 1;
}
