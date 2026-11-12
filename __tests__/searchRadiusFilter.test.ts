import { filterByRadius, resolveProfileDistanceKm, resolveProfileDistance } from '../src/utils/distanceHelper';

describe('Search Radius Filter Verification', () => {
  const mockProfiles = [
    {
      id: 'p1',
      name: 'Nearby User (3 km)',
      distance: '3 km away',
      city: 'Hyderabad',
    },
    {
      id: 'p2',
      name: 'Medium Distance User (15 km)',
      distance: '15 km away',
      city: 'Hyderabad',
    },
    {
      id: 'p3',
      name: 'Far Away User (80 km)',
      distance: '80 km away',
      city: 'Warangal',
    },
    {
      id: 'p4',
      name: 'Very Far User (Delhi)',
      city: 'Delhi',
      // No explicit distance string -> resolved via city coordinates
    },
  ];

  const userLocationHyderabad = { latitude: 17.385, longitude: 78.4867 };

  test('correctly resolves profile distance in km', () => {
    expect(resolveProfileDistanceKm(mockProfiles[0], userLocationHyderabad, 'Hyderabad')).toBe(3);
    expect(resolveProfileDistanceKm(mockProfiles[1], userLocationHyderabad, 'Hyderabad')).toBe(15);
    expect(resolveProfileDistanceKm(mockProfiles[2], userLocationHyderabad, 'Hyderabad')).toBe(80);
    
    // Delhi to Hyderabad is ~1200+ km
    const delhiDist = resolveProfileDistanceKm(mockProfiles[3], userLocationHyderabad, 'Hyderabad');
    expect(delhiDist).toBeGreaterThan(1000);
  });

  test('filters profiles with maxRadius = 10 km (only <= 10 km should appear)', () => {
    const filters = { maxDistanceKm: 10, worldwide: false };
    const results = filterByRadius(mockProfiles, filters, userLocationHyderabad, 'Hyderabad');

    expect(results.length).toBe(1);
    expect(results[0].id).toBe('p1');
  });

  test('filters profiles with maxRadius = 50 km (<= 50 km should appear, far ones excluded)', () => {
    const filters = { maxDistanceKm: 50, worldwide: false };
    const results = filterByRadius(mockProfiles, filters, userLocationHyderabad, 'Hyderabad');

    expect(results.length).toBe(2);
    expect(results.map((r: any) => r.id)).toEqual(['p1', 'p2']);
  });

  test('returns empty array when radius is too small and does not fall back to all profiles', () => {
    const filters = { maxDistanceKm: 2, worldwide: false };
    const results = filterByRadius(mockProfiles, filters, userLocationHyderabad, 'Hyderabad');

    expect(results).toEqual([]);
    expect(results.length).toBe(0);
  });

  test('worldwide: true bypasses radius filtering and includes all profiles', () => {
    const filters = { maxDistanceKm: 5, worldwide: true };
    const results = filterByRadius(mockProfiles, filters, userLocationHyderabad, 'Hyderabad');

    expect(results.length).toBe(mockProfiles.length);
  });

  test('resolveProfileDistance returns consistent human-readable string', () => {
    expect(resolveProfileDistance(mockProfiles[0], userLocationHyderabad, 'Hyderabad')).toBe('3 km away');
    expect(resolveProfileDistance(mockProfiles[1], userLocationHyderabad, 'Hyderabad')).toBe('15 km away');
    expect(resolveProfileDistance(mockProfiles[2], userLocationHyderabad, 'Hyderabad')).toBe('80 km away');
  });
});
