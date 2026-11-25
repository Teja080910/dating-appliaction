import { matchesSearchFilters } from '../src/components/HomeTabComponents/UserList';
import { filterByRadius } from '../src/utils/distanceHelper';
import { getActiveFilterCount } from '../src/utils/types/AsyncStorage';

const profile = {
  name: 'Test Profile',
  age: 28,
  height: 172,
  bodyType: 'Athletic',
  appearance: 'Attractive',
  language: 'English, French',
  languages: ['English', 'French'],
  englishLevel: 'Good',
  ethnicity: 'Asian',
  smoke: 'No',
  lookingFor: 'Relationship',
  currentCity: 'Mumbai',
};

describe('Search Settings fields filter candidates', () => {
  it('filters by age range', () => {
    expect(matchesSearchFilters(profile, { isFilterActive: true, minAge: 25, maxAge: 30 })).toBe(true);
    expect(matchesSearchFilters(profile, { isFilterActive: true, minAge: 30, maxAge: 40 })).toBe(false);
  });

  it('filters by height range', () => {
    expect(matchesSearchFilters(profile, { isFilterActive: true, minHeight: 170, maxHeight: 175 })).toBe(true);
    expect(matchesSearchFilters(profile, { isFilterActive: true, minHeight: 175, maxHeight: 190 })).toBe(false);
  });

  it('filters by body type', () => {
    expect(matchesSearchFilters(profile, { isFilterActive: true, bodyType: ['Athletic'] })).toBe(true);
    expect(matchesSearchFilters(profile, { isFilterActive: true, bodyType: ['Slim'] })).toBe(false);
  });

  it('filters by appearance', () => {
    expect(matchesSearchFilters(profile, { isFilterActive: true, appearance: ['Attractive'] })).toBe(true);
    expect(matchesSearchFilters(profile, { isFilterActive: true, appearance: ['Average'] })).toBe(false);
  });

  it('filters by language', () => {
    expect(matchesSearchFilters(profile, { isFilterActive: true, language: ['English'] })).toBe(true);
    expect(matchesSearchFilters(profile, { isFilterActive: true, language: ['German'] })).toBe(false);
  });

  it('filters by English level', () => {
    expect(matchesSearchFilters(profile, { isFilterActive: true, englishLevel: ['Good'] })).toBe(true);
    expect(matchesSearchFilters(profile, { isFilterActive: true, englishLevel: ['Basic'] })).toBe(false);
  });

  it('filters by ethnicity', () => {
    expect(matchesSearchFilters(profile, { isFilterActive: true, ethnicity: ['Asian'] })).toBe(true);
    expect(matchesSearchFilters(profile, { isFilterActive: true, ethnicity: ['African'] })).toBe(false);
  });

  it('filters by looking for', () => {
    expect(matchesSearchFilters(profile, { isFilterActive: true, lookingFor: ['Relationship'] })).toBe(true);
    expect(matchesSearchFilters(profile, { isFilterActive: true, lookingFor: ['Casual'] })).toBe(false);
  });

  it('filters by smoking', () => {
    expect(matchesSearchFilters(profile, { isFilterActive: true, smoke: 'No' })).toBe(true);
    expect(matchesSearchFilters(profile, { isFilterActive: true, smoke: 'Yes' })).toBe(false);
  });

  it('excludes profiles missing a selected attribute', () => {
    const missing = { name: 'No Data', age: 28 };
    expect(matchesSearchFilters(missing, { isFilterActive: true, bodyType: ['Slim'] })).toBe(false);
    expect(matchesSearchFilters(missing, { isFilterActive: true, language: ['English'] })).toBe(false);
    expect(matchesSearchFilters(missing, { isFilterActive: true, smoke: 'No' })).toBe(false);
    expect(matchesSearchFilters(missing, { isFilterActive: true })).toBe(true);
  });

  it('applies the radius around the selected city', () => {
    const near = { ...profile, currentCity: 'Mumbai', distance: '10 km away' };
    const far = { ...profile, currentCity: 'Delhi', distance: '1,200 km away' };

    const results = filterByRadius(
      [near, far],
      { isFilterActive: true, maxDistanceKm: 50, worldwide: false },
      null,
      'Mumbai'
    );
    expect(results).toHaveLength(1);
    expect(results[0].currentCity).toBe('Mumbai');
  });

  it('counts Show Me as an active filter', () => {
    expect(getActiveFilterCount({ showMe: 'straight_man' } as any)).toBeGreaterThan(0);
    expect(getActiveFilterCount({ showMe: 'both' } as any)).toBeGreaterThan(0);
  });
});
