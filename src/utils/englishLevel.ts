export type CanonicalEnglishLevel = 'Basic' | 'Medium' | 'Good' | 'Very Good';

/**
 * Older profiles (and the onboarding fallback) store values such as
 * "Beginner", "Intermediate", "Advanced", "Native" or "Fluent". Search
 * Settings uses Basic / Medium / Good / Very Good, so everything is mapped to
 * that canonical set before comparing or displaying.
 */
export const normalizeEnglishLevel = (value?: string | null): CanonicalEnglishLevel | '' => {
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) return '';

  // Very good / native / fluent first: "very good" contains "good".
  if (
    raw.includes('very good') ||
    raw.includes('fluent') ||
    raw.includes('native') ||
    raw.includes('proficient') ||
    raw.includes('très bon') ||
    raw.includes('sehr gut') ||
    raw.includes('fluente') ||
    raw.includes('fluido') ||
    raw.includes('nativo')
  ) {
    return 'Very Good';
  }

  if (
    raw.includes('advanced') ||
    raw.includes('avancé') ||
    raw.includes('fortgeschritten') ||
    raw.includes('avanzado') ||
    raw === 'good' ||
    raw.includes('bon') ||
    raw === 'gut'
  ) {
    return 'Good';
  }

  if (
    raw.includes('intermediate') ||
    raw.includes('medium') ||
    raw.includes('conversational') ||
    raw.includes('intermédiaire') ||
    raw.includes('mittel') ||
    raw.includes('intermedio')
  ) {
    return 'Medium';
  }

  if (
    raw.includes('basic') ||
    raw.includes('beginner') ||
    raw.includes('elementary') ||
    raw.includes('basique') ||
    raw.includes('básico') ||
    raw.includes('basico') ||
    raw.includes('anfänger')
  ) {
    return 'Basic';
  }

  return '';
};

export const CANONICAL_ENGLISH_LEVELS: CanonicalEnglishLevel[] = [
  'Basic',
  'Medium',
  'Good',
  'Very Good',
];
