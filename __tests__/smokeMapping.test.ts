import { normalizeSmoke } from '../src/utils/smoke';

describe('Smoke value normalisation', () => {
  it('maps legacy values to Yes / No / Sometimes', () => {
    expect(normalizeSmoke('Occasionally')).toBe('Sometimes');
    expect(normalizeSmoke('Sometimes')).toBe('Sometimes');
    expect(normalizeSmoke('Socially')).toBe('Sometimes');
    expect(normalizeSmoke('Never')).toBe('No');
    expect(normalizeSmoke('Non-smoker')).toBe('No');
    expect(normalizeSmoke('Smoker')).toBe('Yes');
    expect(normalizeSmoke(true)).toBe('Yes');
    expect(normalizeSmoke(false)).toBe('No');
  });
});
