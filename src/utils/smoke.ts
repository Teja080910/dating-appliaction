export type CanonicalSmoke = 'Yes' | 'No' | 'Sometimes';

/**
 * Legacy profiles store "Occasionally", "Never", "Non-smoker", etc.
 * Search Settings and the profile editor use Yes / No / Sometimes.
 */
export const normalizeSmoke = (value?: string | boolean | null): CanonicalSmoke | '' => {
  if (value === true) return 'Yes';
  if (value === false) return 'No';

  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) return '';

  if (
    raw.includes('sometimes') ||
    raw.includes('occasionally') ||
    raw.includes('socially') ||
    raw.includes('parfois') ||
    raw.includes('manchmal') ||
    raw.includes('a veces') ||
    raw.includes('às vezes')
  ) {
    return 'Sometimes';
  }

  if (
    raw === 'yes' ||
    raw === 'true' ||
    raw === 'smoker' ||
    raw.includes('regular') ||
    raw.includes('daily')
  ) {
    return 'Yes';
  }

  if (
    raw === 'no' ||
    raw === 'false' ||
    raw.includes('never') ||
    raw.includes('non-smoker') ||
    raw.includes('non smoker') ||
    raw.includes('non fumeur')
  ) {
    return 'No';
  }

  return '';
};
