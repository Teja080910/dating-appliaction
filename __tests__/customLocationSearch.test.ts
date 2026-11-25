import { resolveProfileDistanceKm, filterByRadius } from '../src/utils/distanceHelper';

const londonCoords = { latitude: 51.5074, longitude: -0.1278 };
const mumbaiCoords = { latitude: 19.076, longitude: 72.8777 };

const londonProfile = {
  id: 'london-1',
  currentCity: 'London',
  latitude: 51.5074,
  longitude: -0.1278,
};

const mumbaiProfile = {
  id: 'mumbai-1',
  currentCity: 'Mumbai',
  latitude: 19.076,
  longitude: 72.8777,
};

describe('Custom location search', () => {
  it('measures distance from the selected custom city, not the device GPS', () => {
    // The phone is physically in Mumbai, but the user selected London.
    expect(resolveProfileDistanceKm(londonProfile, londonCoords, 'London')).toBeLessThan(5);
    expect(resolveProfileDistanceKm(mumbaiProfile, londonCoords, 'London')).toBeGreaterThan(1000);
  });

  it('radius filter keeps profiles around the selected city even if the device is elsewhere', () => {
    const results = filterByRadius(
      [londonProfile, mumbaiProfile],
      { maxDistanceKm: 50 },
      londonCoords,
      'London'
    );

    expect(results.map((item) => item.id)).toEqual(['london-1']);
  });

  it('still uses device GPS for "search near me"', () => {
    const results = filterByRadius(
      [londonProfile, mumbaiProfile],
      { maxDistanceKm: 50 },
      mumbaiCoords,
      'My current location'
    );

    expect(results.map((item) => item.id)).toEqual(['mumbai-1']);
  });
});
