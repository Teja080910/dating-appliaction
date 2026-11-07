import apiClient from '../src/api/apiClient';
import { mockStore } from '../src/mock/mockStore';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

describe('Search Radius / Distance filtering', () => {
  beforeAll(async () => {
    await mockStore.init();
  });

  test('filters profiles strictly within search radius (e.g. 5 km)', async () => {
    const res = await apiClient.post('/search', {
      gender: ['Female'],
      searchRadius: 5,
      worldwide: false,
      page: 0,
      size: 30,
    });

    const profiles = res.data?.content || res.data || [];
    expect(profiles.length).toBeGreaterThan(0);

    // Verify all returned profiles have distance <= 5 km
    profiles.forEach((p: any) => {
      const match = String(p.distance).match(/(\d+(\.\d+)?)/);
      if (match) {
        const dist = parseFloat(match[1]);
        expect(dist).toBeLessThanOrEqual(5);
      }
    });
  });

  test('filters profiles with maxDistanceKm', async () => {
    const res = await apiClient.post('/search', {
      gender: ['Female'],
      maxDistanceKm: 10,
      worldwide: false,
      page: 0,
      size: 30,
    });

    const profiles = res.data?.content || res.data || [];
    expect(profiles.length).toBeGreaterThan(0);

    profiles.forEach((p: any) => {
      const match = String(p.distance).match(/(\d+(\.\d+)?)/);
      if (match) {
        const dist = parseFloat(match[1]);
        expect(dist).toBeLessThanOrEqual(10);
      }
    });
  });

  test('returns all profiles regardless of distance when worldwide is true', async () => {
    const worldwideRes = await apiClient.post('/search', {
      gender: ['Female'],
      searchRadius: 5,
      worldwide: true,
      page: 0,
      size: 50,
    });

    const worldwideProfiles = worldwideRes.data?.content || worldwideRes.data || [];
    // Should contain profiles farther than 5 km
    const hasFartherProfiles = worldwideProfiles.some((p: any) => {
      const match = String(p.distance).match(/(\d+(\.\d+)?)/);
      return match && parseFloat(match[1]) > 5;
    });

    expect(hasFartherProfiles).toBe(true);
  });
});
