import {
  PROFILE_LANGUAGES,
  filterSupportedLanguages,
  isSupportedProfileLanguage,
  getLanguageFlag,
} from '../src/utils/languageHelper';

describe('10 Supported Profile Languages Strict Whitelist', () => {
  it('contains exactly the 10 approved languages', () => {
    expect(PROFILE_LANGUAGES).toEqual([
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
    ]);
    expect(PROFILE_LANGUAGES.length).toBe(10);
  });

  it('filters out extra unapproved languages (Hindi, Gujarati, Telugu, etc.)', () => {
    const raw = 'English, Hindi, Gujarati, Marathi, Telugu';
    const filtered = filterSupportedLanguages(raw);
    expect(filtered).toEqual(['English']);
  });

  it('preserves multiple approved languages while stripping unapproved ones', () => {
    const raw = 'Spanish, Hindi, German, Gujarati, French, Punjabi';
    const filtered = filterSupportedLanguages(raw);
    expect(filtered).toEqual(['Spanish', 'German', 'French']);
  });

  it('handles array input and trims whitespace / case-insensitivity', () => {
    const raw = [' english ', 'HINDI', 'spanish', 'GUJARATI'];
    const filtered = filterSupportedLanguages(raw);
    expect(filtered).toEqual(['English', 'Spanish']);
  });

  it('safely defaults to English if no supported languages are found or input is empty', () => {
    expect(filterSupportedLanguages('Hindi, Gujarati, Telugu')).toEqual(['English']);
    expect(filterSupportedLanguages('')).toEqual(['English']);
    expect(filterSupportedLanguages(null)).toEqual(['English']);
    expect(filterSupportedLanguages(undefined)).toEqual(['English']);
  });

  it('correctly validates isSupportedProfileLanguage', () => {
    expect(isSupportedProfileLanguage('English')).toBe(true);
    expect(isSupportedProfileLanguage('spanish')).toBe(true);
    expect(isSupportedProfileLanguage('Hindi')).toBe(false);
    expect(isSupportedProfileLanguage('Gujarati')).toBe(false);
    expect(isSupportedProfileLanguage('Telugu')).toBe(false);
  });

  it('returns valid flags for all 10 supported languages', () => {
    for (const lang of PROFILE_LANGUAGES) {
      const flag = getLanguageFlag(lang);
      expect(flag).not.toBe('🌐');
    }
  });
});
