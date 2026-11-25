import { normalizeAppearance } from '../src/utils/appearance';
import { matchesSearchFilters } from '../src/components/HomeTabComponents/UserList';

describe('Appearance normalisation', () => {
  it('maps legacy profile values to Search Settings values', () => {
    expect(normalizeAppearance('Beautiful')).toBe('Very attractive');
    expect(normalizeAppearance('Handsome')).toBe('Very attractive');
    expect(normalizeAppearance('Gorgeous')).toBe('Very attractive');
    expect(normalizeAppearance('Good looking')).toBe('Attractive');
    expect(normalizeAppearance('Cute')).toBe('Attractive');
    expect(normalizeAppearance('Normal')).toBe('Average');
    expect(normalizeAppearance('Average')).toBe('Average');
    expect(normalizeAppearance('Unattractive')).toBe('Below average');
  });

  it('filters legacy appearance values correctly', () => {
    const beautiful = { id: '1', appearance: 'Beautiful' };
    const normal = { id: '2', appearance: 'Normal' };

    expect(
      matchesSearchFilters(beautiful, { isFilterActive: true, appearance: ['Very attractive'] })
    ).toBe(true);

    expect(
      matchesSearchFilters(beautiful, { isFilterActive: true, appearance: ['Average'] })
    ).toBe(false);

    expect(
      matchesSearchFilters(normal, { isFilterActive: true, appearance: ['Average'] })
    ).toBe(true);
  });
});
