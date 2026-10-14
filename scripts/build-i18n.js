/* Builds i18n/en.json (flat key -> text) and i18n/en.meta.json (key -> source refs) */
const fs = require('fs');
const path = require('path');

const inv = require('../i18n/raw-inventory.json');

const DIR_GROUPS = {
  Auth: 'auth',
  onboarding: 'onboarding',
  HomeTab: 'home',
  MessageTab: 'messages',
  RequestsTab: 'requests',
  SentTab: 'sent',
  ProfileTab: 'profile',
  SearchSettings: 'search',
  Navigations: 'nav',
  MoreInfoTab: 'more_info',
};

const COMPONENT_GROUPS = {
  SearchSettingsComponents: 'search',
  HomeTabComponents: 'home',
  MessageTabComponents: 'messages',
  ProfileTabComponents: 'profile',
  MoreInfoTabComponents: 'more_info',
  RequestsTabComponents: 'requests',
  SentTabComponents: 'sent',
  OnboardingComponents: 'onboarding',
  AuthComponents: 'auth',
  UploadImageComponents: 'profile',
  onboarding: 'onboarding',
};

const slug = (s) =>
  s
    .replace(/\{[^{}]*\}/g, ' ')       // drop placeholders from key names
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 70)
    .replace(/_+$/, '');

const groupFor = (file) => {
  const p = file.replace(/\\/g, '/');
  const parts = p.split('/');
  if (parts[0] === 'src' && parts[1] === 'screens') {
    const dir = DIR_GROUPS[parts[2]] || slug(parts[2]);
    return `${dir}.${slug(parts[3].replace(/\.tsx?$/, ''))}`;
  }
  if (parts[0] === 'src' && parts[1] === 'components') {
    const dir = parts.length > 3 ? COMPONENT_GROUPS[parts[2]] || slug(parts[2]) : 'common';
    const fileName = parts[parts.length - 1].replace(/\.tsx?$/, '');
    return `${dir}.${slug(fileName)}`;
  }
  return `common.${slug(parts[parts.length - 1].replace(/\.tsx?$/, ''))}`;
};

const en = {};
const meta = {};
const usedKeys = new Map();

for (const item of inv.items) {
  const group = groupFor(item.files[0]);
  const base = slug(item.text) || 'text';
  let key = `${group}.${base}`;
  if (usedKeys.has(key)) {
    if (usedKeys.get(key) === item.text.toLowerCase()) {continue;} // same key, same text
    let n = 2;
    while (usedKeys.has(`${group}.${base}_${n}`)) {n++;}
    key = `${group}.${base}_${n}`;
  }
  usedKeys.set(key, item.text.toLowerCase());
  en[key] = item.text;
  meta[key] = { file: item.files[0], line: item.line, kind: item.kind, files: item.files };
}

fs.writeFileSync(path.join(__dirname, '..', 'i18n', 'en.json'), JSON.stringify(en, null, 2) + '\n');
fs.writeFileSync(path.join(__dirname, '..', 'i18n', 'en.meta.json'), JSON.stringify(meta, null, 2) + '\n');
console.log(`en.json: ${Object.keys(en).length} keys`);
