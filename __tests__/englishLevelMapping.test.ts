import { normalizeEnglishLevel } from '../src/utils/englishLevel';
import { matchesSearchFilters } from '../src/components/HomeTabComponents/UserList';

describe('English level normalisation', () => {
  it('maps legacy profile values to the Search Settings levels', () => {
    expect(normalizeEnglishLevel('Beginner')).toBe('Basic');
    expect(normalizeEnglishLevel('Basic')).toBe('Basic');
    expect(normalizeEnglishLevel('Intermediate')).toBe('Medium');
    expect(normalizeEnglishLevel('Medium')).toBe('Medium');
    expect(normalizeEnglishLevel('Advanced')).toBe('Good');
    expect(normalizeEnglishLevel('Good')).toBe('Good');
    expect(normalizeEnglishLevel('Fluent')).toBe('Very Good');
    expect(normalizeEnglishLevel('Native')).toBe('Very Good');
    expect(normalizeEnglishLevel('Very Good')).toBe('Very Good');
  });

  it('filters legacy Fluent/Intermediate profiles correctly', () => {
    const intermediate = { id: '1', englishLevel: 'Intermediate' };
    const fluent = { id: '2', englishLevel: 'Fluent' };

    expect(
      matchesSearchFilters(intermediate, { isFilterActive: true, englishLevel: ['Medium'] })
    ).toBe(true);

    expect(
      matchesSearchFilters(intermediate, { isFilterActive: true, englishLevel: ['Basic'] })
    ).toBe(false);

    expect(
      matchesSearchFilters(fluent, { isFilterActive: true, englishLevel: ['Very Good'] })
    ).toBe(true);
  });
});
