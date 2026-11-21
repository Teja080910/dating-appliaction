export interface LanguageOption {
  code: string;
  name: string;
  englishName: string;
  nativeName?: string;
  flag: string;
}

export const APP_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', englishName: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', englishName: 'Spanish', nativeName: 'español', flag: '🇪🇸' },
  { code: 'pt', name: 'Portuguese', englishName: 'Portuguese', nativeName: 'português', flag: '🇵🇹' },
  { code: 'de', name: 'German', englishName: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'ro', name: 'Romanian', englishName: 'Romanian', nativeName: 'română', flag: '🇷🇴' },
  { code: 'ru', name: 'Russian', englishName: 'Russian', nativeName: 'русский', flag: '🇷🇺' },
  { code: 'fr', name: 'French', englishName: 'French', nativeName: 'français', flag: '🇫🇷' },
  { code: 'zh', name: 'Chinese', englishName: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', englishName: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'id', name: 'Indonesian', englishName: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
];

export const PROFILE_LANGUAGES: string[] = [
  'English',
  'Spanish',
  'Portuguese',
  'German',
  'Romanian',
  'Russian',
  'French',
  'Chinese',
  'Japanese',
  'Indonesian',
];

/**
 * Normalizes and filters a language string or array to ONLY include
 * the 10 officially supported profile languages.
 * Strips out any unapproved/extra languages (like Hindi, Gujarati, Telugu, etc.).
 * If no supported language matches, defaults to ['English'].
 */
export const filterSupportedLanguages = (
  rawLanguage: string | string[] | null | undefined
): string[] => {
  if (!rawLanguage) return ['English'];
  const candidates: string[] = Array.isArray(rawLanguage)
    ? rawLanguage
    : String(rawLanguage).split(',');

  const matched: string[] = [];
  for (const cand of candidates) {
    const trimmed = String(cand).trim().toLowerCase();
    if (!trimmed) continue;
    const found = PROFILE_LANGUAGES.find(
      (pl) => pl.toLowerCase() === trimmed
    );
    if (found && !matched.includes(found)) {
      matched.push(found);
    }
  }

  return matched.length > 0 ? matched : ['English'];
};

export const isSupportedProfileLanguage = (lang: string): boolean => {
  if (!lang) return false;
  const lower = lang.trim().toLowerCase();
  return PROFILE_LANGUAGES.some((pl) => pl.toLowerCase() === lower);
};

/**
 * Returns the country flag emoji for a given language string (name, englishName, or code).
 * Defaults to 🌐 if unknown.
 */
export const getLanguageFlag = (language?: string | null): string => {
  if (!language) return '🌐';
  const clean = language.trim().toLowerCase();

  // Direct match against APP_LANGUAGES
  for (const item of APP_LANGUAGES) {
    if (
      item.code.toLowerCase() === clean ||
      item.name.toLowerCase() === clean ||
      item.englishName.toLowerCase() === clean ||
      (item.nativeName && item.nativeName.toLowerCase() === clean)
    ) {
      return item.flag;
    }
  }

  // Keyword / partial matchers for the 10 languages
  if (clean.includes('english') || clean === 'en' || clean === 'eng') return '🇬🇧';
  if (clean.includes('spanish') || clean.includes('español') || clean === 'es') return '🇪🇸';
  if (clean.includes('portuguese') || clean.includes('português') || clean === 'pt') {
    if (clean.includes('brasil') || clean.includes('brazil') || clean === 'pt-br') return '🇧🇷';
    return '🇵🇹';
  }
  if (clean.includes('german') || clean.includes('deutsch') || clean === 'de') return '🇩🇪';
  if (clean.includes('romanian') || clean.includes('română') || clean === 'ro') return '🇷🇴';
  if (clean.includes('russian') || clean.includes('русский') || clean === 'ru') return '🇷🇺';
  if (clean.includes('french') || clean.includes('français') || clean === 'fr') return '🇫🇷';
  if (clean.includes('chinese') || clean.includes('mandarin') || clean === 'zh' || clean.includes('中文')) return '🇨🇳';
  if (clean.includes('japanese') || clean === 'ja' || clean.includes('日本語')) return '🇯🇵';
  if (clean.includes('indonesian') || clean === 'id' || clean.includes('bahasa')) return '🇮🇩';

  return '🌐';
};
