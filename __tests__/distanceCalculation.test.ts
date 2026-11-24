import {
  calculateDistanceKm,
  resolveProfileDistance,
  getCityCoords,
} from '../src/utils/distanceHelper';

describe('Distance Helper & Calculation', () => {
  test('calculateDistanceKm calculates accurate Haversine distance between coordinates', () => {
    // Mumbai (19.0760, 72.8777) to Pune (18.5204, 73.8567) is ~120 km
    const dist = calculateDistanceKm(19.076, 72.8777, 18.5204, 73.8567);
    expect(dist).toBeGreaterThanOrEqual(115);
    expect(dist).toBeLessThanOrEqual(130);
  });

  test('preserves direct distance if profile has distance string', () => {
    const profile = { id: 101, distance: '3 km away', currentCity: 'Mumbai' };
    const res = resolveProfileDistance(profile);
    expect(res).toBe('3 km away');
  });

  test('formats numeric distance correctly', () => {
    const profile = { id: 102, distanceKm: 8.4 };
    const res = resolveProfileDistance(profile);
    expect(res).toBe('8 km away');
  });

  test('calculates GPS distance when user and profile coordinates are present', () => {
    const userLocation = { latitude: 19.076, longitude: 72.8777 }; // Mumbai
    const profile = {
      id: 103,
      latitude: 19.1136, // ~5 km away in Mumbai
      longitude: 72.8697,
    };
    const res = resolveProfileDistance(profile, userLocation);
    expect(res).toMatch(/^\d+\s+km away$/);
    const num = parseInt(res, 10);
    expect(num).toBeGreaterThanOrEqual(3);
    expect(num).toBeLessThanOrEqual(8);
  });

  test('calculates distance between known cities', () => {
    const profile = { id: 104, currentCity: 'Pune' };
    const res = resolveProfileDistance(profile, null, 'Mumbai');
    expect(res).toMatch(/^\d+\s+km away$/);
    const num = parseInt(res, 10);
    expect(num).toBeGreaterThanOrEqual(115);
  });

  test('returns within 1 km or city distance when user and profile share same city', () => {
    const profile1 = { id: 'usr_woman_201', currentCity: 'Mumbai' };
    const res1 = resolveProfileDistance(profile1, null, 'Mumbai');
    expect(res1).toBe('< 1 km away');
  });

  test('returns actual city or Nearby when coordinates cannot be determined without fake numbers', () => {
    const profile = { id: '999', currentCity: 'San Francisco' };
    const res = resolveProfileDistance(profile, null, null);
    expect(res).toBe('San Francisco');

    const profileNoCity = { id: '1000' };
    const resNearby = resolveProfileDistance(profileNoCity, null, null);
    expect(resNearby).toBe('Nearby');
  });

  test('NEVER falls back to static 21 km away for arbitrary profiles', () => {
    const profiles = [
      { id: '1', name: 'User 1', currentCity: 'Mumbai' },
      { id: '2', name: 'User 2', currentCity: 'Pune' },
      { id: '3', name: 'User 3', currentCity: 'Delhi' },
      { id: '4', name: 'User 4', currentCity: 'Hyderabad' },
    ];

    const results = profiles.map((p) => resolveProfileDistance(p, { latitude: 19.076, longitude: 72.8777 }));
    results.forEach((r) => {
      expect(r).not.toBe('21 km away');
      expect(r).toMatch(/km away$/);
    });
  });
});
