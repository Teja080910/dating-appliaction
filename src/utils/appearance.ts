export type CanonicalAppearance =
  | 'Very attractive'
  | 'Attractive'
  | 'Average'
  | 'Below average';

/**
 * Legacy profiles store appearance as "Beautiful", "Handsome", "Good looking",
 * "Normal", etc. Search Settings uses four canonical values, so map everything
 * before displaying or filtering.
 */
export const normalizeAppearance = (value?: string | null): CanonicalAppearance | '' => {
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) return '';

  if (
    raw.includes('very attractive') ||
    raw.includes('very beautiful') ||
    raw.includes('very handsome') ||
    raw.includes('very good looking') ||
    raw.includes('gorgeous') ||
    raw.includes('stunning') ||
    raw.includes('beautiful') ||
    raw.includes('handsome') ||
    raw.includes('très beau') ||
    raw.includes('très belle') ||
    raw.includes('sehr attraktiv') ||
    raw.includes('sehr gutaussehend') ||
    raw.includes('muy atractivo') ||
    raw.includes('muy atractiva') ||
    raw.includes('muito atraente')
  ) {
    return 'Very attractive';
  }

  if (
    raw.includes('below average') ||
    raw.includes('unattractive') ||
    raw.includes('not attractive') ||
    raw.includes('ugly') ||
    raw.includes('poor') ||
    raw.includes('unterdurchschnittlich') ||
    raw.includes('poco atractivo') ||
    raw.includes('poco atractiva') ||
    raw.includes('pouco atraente')
  ) {
    return 'Below average';
  }

  if (
    raw.includes('average') ||
    raw.includes('normal') ||
    raw.includes('ordinary') ||
    raw.includes('okay') ||
    raw === 'ok' ||
    raw.includes('durchschnittlich') ||
    raw.includes('promedio') ||
    raw.includes('média') ||
    raw.includes('moyen')
  ) {
    return 'Average';
  }

  if (
    raw.includes('attractive') ||
    raw.includes('good looking') ||
    raw.includes('pretty') ||
    raw.includes('cute') ||
    raw === 'good' ||
    raw.includes('attirant') ||
    raw.includes('beau') ||
    raw.includes('belle') ||
    raw.includes('attraktiv') ||
    raw.includes('atractivo') ||
    raw.includes('atractiva') ||
    raw.includes('atraente') ||
    raw.includes('bonito') ||
    raw.includes('bonita')
  ) {
    return 'Attractive';
  }

  return '';
};

export const CANONICAL_APPEARANCES: CanonicalAppearance[] = [
  'Very attractive',
  'Attractive',
  'Average',
  'Below average',
];
