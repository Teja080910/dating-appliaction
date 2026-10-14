/* Usage: node scripts/codemod-i18n.js [--dry]
 * Replaces hardcoded English strings (from i18n/en.json) with t('key') calls
 * across the files listed in i18n/raw-inventory.json, and inserts
 * useTranslation() into enclosing React components so the UI re-renders
 * when the app language changes.
 */
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');

const DRY = process.argv.includes('--dry');
const ROOT = path.join(__dirname, '..');
const en = require(path.join(ROOT, 'i18n/en.json'));
const inventory = require(path.join(ROOT, 'i18n/raw-inventory.json')).items;

const SKIP_KEYS = new Set([
  'loc', 'start', 'end', 'range', 'extra',
  'leadingComments', 'trailingComments', 'innerComments', 'comments',
]);
const SKIP_ATTRS = new Set(['name', 'testID', 'key', 'fontFamily', 'source', 'uri']);
const PH = '<<PH>>';

// ---- lookup maps ----------------------------------------------------------
const textToKey = new Map();
for (const [key, text] of Object.entries(en)) {
  if (textToKey.has(text) && textToKey.get(text) !== key) {
    console.warn(`WARN duplicate en text: ${JSON.stringify(text)}`);
    continue;
  }
  textToKey.set(text, key);
}

const phRe = /\{([A-Za-z0-9_]+)\}/g;
const skeletonToKey = new Map();
const keyPlaceholders = new Map();
for (const [key, text] of Object.entries(en)) {
  const phs = [...text.matchAll(phRe)].map((m) => m[1]);
  keyPlaceholders.set(key, phs);
  const skel = text.replace(phRe, PH);
  if (skeletonToKey.has(skel) && skeletonToKey.get(skel) !== key) {
    console.warn(`WARN skeleton collision: ${JSON.stringify(text)}`);
    continue;
  }
  skeletonToKey.set(skel, key);
}

// ---- files to process -----------------------------------------------------
const IGNORE = /(__tests__|__mocks__|node_modules|[\\/]scripts[\\/]|[\\/]i18n[\\/])/;
const files = new Set();
for (const item of inventory) {
  for (const f of item.files || [item.file]) {
    if (f && !IGNORE.test(f)) {
      files.add(f);
    }
  }
}

const problems = [];
let totalEdits = 0;
let totalHooks = 0;

for (const relFile of [...files].sort()) {
  const abs = path.join(ROOT, relFile);
  if (!fs.existsSync(abs)) {
    problems.push(`MISSING FILE: ${relFile}`);
    continue;
  }
  processFile(relFile, abs);
}

function walk(node, parentMap, out, parent) {
  if (!node || typeof node.type !== 'string') {
    return;
  }
  if (parentMap && !parentMap.has(node)) {
    parentMap.set(node, parent || null);
  }
  out.push(node);
  for (const key of Object.keys(node)) {
    if (SKIP_KEYS.has(key)) {
      continue;
    }
    const child = node[key];
    if (Array.isArray(child)) {
      for (const c of child) {
        walk(c, parentMap, out, node);
      }
    } else if (child && typeof child.type === 'string') {
      walk(child, parentMap, out, node);
    }
  }
}

function lineOf(code, pos) {
  let line = 1;
  for (let i = 0; i < pos && i < code.length; i++) {
    if (code[i] === '\n') {
      line++;
    }
  }
  return line;
}

function processFile(relFile, abs) {
  const code = fs.readFileSync(abs, 'utf8');
  const isTsx = relFile.endsWith('.tsx');
  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: 'module',
      plugins: isTsx ? ['jsx', 'typescript'] : ['typescript'],
      errorRecovery: true,
    });
  } catch (e) {
    problems.push(`PARSE FAIL ${relFile}: ${e.message}`);
    return;
  }

  const parentMap = new Map();
  const nodes = [];
  walk(ast.program, parentMap, nodes, null);

  const edits = [];
  const hookFns = new Map();
  let replaced = 0;
  let skippedTemplates = 0;

  const isFn = (n) =>
    n.type === 'FunctionDeclaration' ||
    n.type === 'FunctionExpression' ||
    n.type === 'ArrowFunctionExpression';

  const isComponentFn = (fn) => {
    if (fn.body.type !== 'BlockStatement') {
      return false;
    }
    if (fn.type === 'FunctionDeclaration' && fn.id && /^[A-Z]/.test(fn.id.name)) {
      return true;
    }
    const par = parentMap.get(fn);
    if (
      par &&
      par.type === 'VariableDeclarator' &&
      par.id.type === 'Identifier' &&
      /^[A-Z]/.test(par.id.name)
    ) {
      return true;
    }
    if (
      par &&
      par.type === 'AssignmentExpression' &&
      par.left.type === 'Identifier' &&
      /^[A-Z]/.test(par.left.name)
    ) {
      return true;
    }
    if (par && par.type === 'ExportDefaultDeclaration') {
      return true;
    }
    return false;
  };

  const fnCallsUseTranslation = (fn) =>
    nodes.some(
      (n) =>
        n.type === 'CallExpression' &&
        n.callee.type === 'Identifier' &&
        n.callee.name === 'useTranslation' &&
        n.start >= fn.body.start &&
        n.end <= fn.body.end
    );

  const markHooks = (node) => {
    let cur = node;
    while ((cur = parentMap.get(cur))) {
      if (isFn(cur) && isComponentFn(cur) && !fnCallsUseTranslation(cur)) {
        if (!hookFns.has(cur.start)) {
          hookFns.set(cur.start, cur);
        }
      }
    }
  };

  const attrNameOf = (node) => {
    const par = parentMap.get(node);
    if (par && par.type === 'JSXAttribute' && par.name && par.name.type === 'JSXIdentifier') {
      return par.name.name;
    }
    return null;
  };

  for (const node of nodes) {
    if (node.type === 'JSXText') {
      const trimmed = node.value.trim();
      if (!trimmed) {
        continue;
      }
      const key = textToKey.get(trimmed);
      if (key) {
        edits.push({ start: node.start, end: node.end, text: `{t('${key}')}` });
        markHooks(node);
        replaced++;
      }
    } else if (node.type === 'StringLiteral') {
      const key = textToKey.get(node.value);
      if (!key) {
        continue;
      }
      const par = parentMap.get(node);
      if (
        par &&
        (par.type === 'ImportDeclaration' ||
          par.type === 'ImportSpecifier' ||
          par.type === 'ImportDefaultSpecifier' ||
          par.type === 'ExportSpecifier')
      ) {
        continue;
      }
      // skip TypeScript type positions (e.g. useState<'Invitations'>)
      let anc = par;
      let inType = false;
      while (anc) {
        if (
          anc.type.startsWith('TS') &&
          anc.type !== 'TSAsExpression' &&
          anc.type !== 'TSNonNullExpression'
        ) {
          inType = true;
          break;
        }
        anc = parentMap.get(anc);
      }
      if (inType) {
        continue;
      }
      if (par && par.type === 'ObjectProperty' && par.key === node && !par.computed) {
        continue;
      }
      if (par && par.type === 'MemberExpression' && par.property === node && !par.computed) {
        continue;
      }
      const attr = attrNameOf(node);
      if (attr && SKIP_ATTRS.has(attr)) {
        continue;
      }
      if (par && par.type === 'JSXAttribute') {
        edits.push({ start: node.start, end: node.end, text: `{t('${key}')}` });
      } else {
        edits.push({ start: node.start, end: node.end, text: `t('${key}')` });
      }
      markHooks(node);
      replaced++;
    } else if (node.type === 'TemplateLiteral') {
      if (node.expressions.length === 0) {
        const cooked = node.quasis[0].value.cooked;
        const key = textToKey.get(cooked);
        if (key) {
          edits.push({ start: node.start, end: node.end, text: `t('${key}')` });
          markHooks(node);
          replaced++;
        }
        continue;
      }
      let skel = '';
      for (let i = 0; i < node.quasis.length; i++) {
        skel += node.quasis[i].value.cooked ?? '';
        if (i < node.expressions.length) {
          skel += PH;
        }
      }
      const key = skeletonToKey.get(skel);
      if (!key) {
        continue;
      }
      const phs = keyPlaceholders.get(key) || [];
      if (phs.length !== node.expressions.length) {
        problems.push(
          `TEMPLATE PARAM MISMATCH ${relFile}:${lineOf(code, node.start)} ${key} (${phs.length} ph vs ${node.expressions.length} expr)`
        );
        skippedTemplates++;
        continue;
      }
      const seen = new Set();
      const params = [];
      phs.forEach((ph, i) => {
        if (seen.has(ph)) {
          return; // same placeholder interpolated twice — one param covers all
        }
        seen.add(ph);
        const expr = node.expressions[i];
        if (expr.type === 'Identifier' && expr.name === ph) {
          params.push(ph);
        } else {
          params.push(`${ph}: ${code.slice(expr.start, expr.end)}`);
        }
      });
      edits.push({
        start: node.start,
        end: node.end,
        text: `t('${key}', { ${params.join(', ')} })`,
      });
      markHooks(node);
      replaced++;
    }
  }

  if (replaced === 0) {
    return;
  }

  for (const fn of hookFns.values()) {
    const insertAt = fn.body.start + 1;
    const lineStart = code.lastIndexOf('\n', fn.start) + 1;
    const fnIndent = (code.slice(lineStart, fn.start).match(/^[ \t]*/) || [''])[0];
    const indent = fnIndent + '  ';
    edits.push({ start: insertAt, end: insertAt, text: `\n${indent}useTranslation();` });
    totalHooks++;
  }

  const importDecls = nodes.filter((n) => n.type === 'ImportDeclaration');
  const i18nImport = importDecls.find((n) => /(^|\/)i18n$/.test(n.source.value));
  const needHook = hookFns.size > 0;
  const relImport = path
    .relative(path.dirname(abs), path.join(ROOT, 'src', 'i18n'))
    .split(path.sep)
    .join('/');
  const importPath = relImport.startsWith('.') ? relImport : `./${relImport}`;

  if (i18nImport) {
    const names = new Set(
      i18nImport.specifiers
        .filter((s) => s.type === 'ImportSpecifier')
        .map((s) => s.local.name)
    );
    names.add('t');
    if (needHook) {
      names.add('useTranslation');
    }
    const rank = { t: 0, useTranslation: 1 };
    const ordered = [...names].sort(
      (a, b) => (rank[a] ?? 2) - (rank[b] ?? 2) || a.localeCompare(b)
    );
    edits.push({
      start: i18nImport.start,
      end: i18nImport.end,
      text: `import { ${ordered.join(', ')} } from '${i18nImport.source.value}';`,
    });
  } else {
    const names = needHook ? 't, useTranslation' : 't';
    const importLine = `\nimport { ${names} } from '${importPath}';`;
    if (importDecls.length > 0) {
      const last = importDecls[importDecls.length - 1];
      edits.push({ start: last.end, end: last.end, text: importLine });
    } else {
      edits.push({ start: 0, end: 0, text: importLine + '\n' });
    }
  }

  // drop edits contained within another (larger) edit — e.g. a StringLiteral
  // inside a TemplateLiteral that is itself being replaced as a whole
  edits.sort((a, b) => a.start - b.start || b.end - a.end);
  const filtered = [];
  let lastEnd = -1;
  for (const e of edits) {
    if (e.start < lastEnd) {
      continue; // overlaps a previous (outer) edit
    }
    filtered.push(e);
    lastEnd = Math.max(lastEnd, e.end);
  }
  edits.length = 0;
  edits.push(...filtered);

  edits.sort((a, b) => b.start - a.start || b.end - a.end);
  let out = code;
  for (const e of edits) {
    out = out.slice(0, e.start) + e.text + out.slice(e.end);
    totalEdits++;
  }

  try {
    parser.parse(out, {
      sourceType: 'module',
      plugins: isTsx ? ['jsx', 'typescript'] : ['typescript'],
      errorRecovery: true,
    });
  } catch (e) {
    problems.push(`OUTPUT PARSE FAIL ${relFile}: ${e.message}`);
    return;
  }

  console.log(
    `${relFile}: ${replaced} strings, ${hookFns.size} hook(s)${skippedTemplates ? `, ${skippedTemplates} skipped templates` : ''}`
  );
  if (!DRY) {
    fs.writeFileSync(abs, out);
  }
}

console.log(`\n${DRY ? '[DRY] ' : ''}edits applied: ${totalEdits}, hooks inserted: ${totalHooks}`);
if (problems.length) {
  console.log(`\nPROBLEMS (${problems.length}):`);
  for (const p of problems) {
    console.log('  ' + p);
  }
  process.exitCode = 1;
}
