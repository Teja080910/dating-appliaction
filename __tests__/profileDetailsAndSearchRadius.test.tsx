import React from 'react';
import { filterByRadius, resolveProfileDistanceKm, resolveProfileDistance } from '../src/utils/distanceHelper';

describe('Search Radius and Profile Distance', () => {
  const userCoords = { latitude: 16.5062, longitude: 80.648 }; // Vijayawada
  const userCity = 'Vijayawada';

  const mockProfiles = [
    {
      id: 'p1',
      name: 'Sree',
      distance: '4 km away',
      currentCity: 'Vijayawada',
      place: 'Patamata, Vijayawada',
      latitude: 16.502,
      longitude: 80.655,
    },
    {
      id: 'p2',
      name: 'Ananya',
      distance: '24 km away',
      currentCity: 'Guntur',
      latitude: 16.3067,
      longitude: 80.4365,
    },
    {
      id: 'p3',
      name: 'Pooja',
      distance: '200 km away',
      currentCity: 'Hyderabad',
      latitude: 17.385,
      longitude: 78.4867,
    },
    {
      id: 'p4',
      name: 'Maya',
      distance: 2,
      currentCity: 'Vijayawada',
      latitude: 16.51,
      longitude: 80.65,
    },
  ];

  test('strictly filters profiles within 5 km radius', () => {
    const filters = { maxDistanceKm: 5, worldwide: false };
    const filtered = filterByRadius(mockProfiles, filters, userCoords, userCity);

    // Only p1 (4 km) and p4 (2 km) should be returned
    expect(filtered.map((p) => p.id)).toEqual(['p1', 'p4']);
  });

  test('filters profiles within 25 km radius', () => {
    const filters = { maxDistanceKm: 25, worldwide: false };
    const filtered = filterByRadius(mockProfiles, filters, userCoords, userCity);

    // p1 (4 km), p2 (24 km), and p4 (2 km) should be returned; p3 (200 km) excluded
    expect(filtered.map((p) => p.id)).toEqual(['p1', 'p2', 'p4']);
  });

  test('worldwide search ignores radius restrictions', () => {
    const filters = { maxDistanceKm: 5, worldwide: true };
    const filtered = filterByRadius(mockProfiles, filters, userCoords, userCity);

    expect(filtered.length).toBe(4);
  });

  test('resolves profile distance correctly without synthetic fallback', () => {
    const p1Dist = resolveProfileDistance(mockProfiles[0], userCoords, userCity);
    expect(p1Dist).toBe('4 km away');

    const p2DistKm = resolveProfileDistanceKm(mockProfiles[1], userCoords, userCity);
    expect(p2DistKm).toBe(24);

    const p4Dist = resolveProfileDistance(mockProfiles[3], userCoords, userCity);
    expect(p4Dist).toBe('2 km away');
  });
});
