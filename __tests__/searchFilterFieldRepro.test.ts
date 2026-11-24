import { handleMockRequest } from '../src/mock/mockAdapter';
import { mockStore } from '../src/mock/mockStore';
import { matchesSearchFilters } from '../src/components/HomeTabComponents/UserList';
import { filterByRadius } from '../src/utils/distanceHelper';

describe('Search Filter Field Match Test', () => {
  beforeAll(async () => {
    await mockStore.init();
  });

  it('matches profile when filtering by its fields', async () => {
    const allProfiles = await mockStore.getProfiles('woman');
    const ananya = allProfiles.find(p => p.name === 'Ananya Roy' || p.displayName === 'Ananya');
    expect(ananya).toBeDefined();

    // Case 1: Search by Body Type
    const resBt = await handleMockRequest({
      method: 'POST',
      url: '/search',
      data: {
        gender: ['Female'],
        bodyType: [ananya?.bodyType],
      },
    } as any);
    const btMatches = resBt?.data?.content || [];
    expect(btMatches.some((p: any) => p.id === ananya?.id || p.userId === ananya?.userId)).toBe(true);

    // Case 2: Search by Appearance
    const resApp = await handleMockRequest({
      method: 'POST',
      url: '/search',
      data: {
        gender: ['Female'],
        appearance: [ananya?.appearance],
      },
    } as any);
    const appMatches = resApp?.data?.content || [];
    expect(appMatches.some((p: any) => p.id === ananya?.id || p.userId === ananya?.userId)).toBe(true);

    // Case 3: Search by Language
    const resLang = await handleMockRequest({
      method: 'POST',
      url: '/search',
      data: {
        gender: ['Female'],
        language: ['English'],
      },
    } as any);
    const langMatches = resLang?.data?.content || [];
    expect(langMatches.some((p: any) => p.id === ananya?.id || p.userId === ananya?.userId)).toBe(true);

    // Case 4: Search by Smoke
    const resSmoke = await handleMockRequest({
      method: 'POST',
      url: '/search',
      data: {
        gender: ['Female'],
        smoke: ananya?.smoke,
      },
    } as any);
    const smokeMatches = resSmoke?.data?.content || [];
    expect(smokeMatches.some((p: any) => p.id === ananya?.id || p.userId === ananya?.userId)).toBe(true);

    // Case 5: Search by Drink - Sometimes matches Socially
    const resDrink = await handleMockRequest({
      method: 'POST',
      url: '/search',
      data: {
        gender: ['Female'],
        drink: 'Sometimes',
      },
    } as any);
    const drinkMatches = resDrink?.data?.content || [];
    expect(drinkMatches.some((p: any) => p.id === ananya?.id || p.userId === ananya?.userId)).toBe(true);

    // Case 6: Realistic SearchScreen payload for Priya Sen (Bengaluru)
    const priya = allProfiles.find(p => p.name === 'Priya Sen');
    expect(priya).toBeDefined();

    const realPayload = {
      gender: ['Female'],
      minAge: 18,
      maxAge: 40,
      minHeight: 160,
      maxHeight: 170,
      bodyType: ['Slim'],
      maxDistanceKm: 50,
      searchRadius: 50,
      radius: 50,
      worldwide: false,
      location: 'Mumbai, India',
      city: 'Mumbai, India',
    };
    const resPriya = await handleMockRequest({
      method: 'POST',
      url: '/search',
      data: realPayload,
    } as any);
    const priyaMatches = resPriya?.data?.content || [];
    expect(priyaMatches.some((p: any) => p.name === 'Priya Sen')).toBe(true);

    // Case 7: Combined multi-attribute filtering (Age + Height + BodyType + Smoke + Drink)
    const combinedPayload = {
      gender: ['Female'],
      minAge: 20,
      maxAge: 26,
      minHeight: 165,
      maxHeight: 170,
      bodyType: ['Slim'],
      smoke: 'No',
      drink: 'Sometimes',
      lookingFor: ['Relationship'],
    };
    const resCombined = await handleMockRequest({
      method: 'POST',
      url: '/search',
      data: combinedPayload,
    } as any);
    const combinedMatches = resCombined?.data?.content || [];
    expect(combinedMatches.some((p: any) => p.name === 'Ananya Roy')).toBe(true);
  });

  it('matchesSearchFilters correctly validates profile against search filters', () => {
    const profile = {
      name: 'Ananya Roy',
      age: 24,
      height: 168,
      bodyType: 'Slim',
      appearance: 'Athletic',
      language: 'English, French',
      languages: ['English', 'French'],
      englishLevel: 'Very Good',
      ethnicity: 'South Asian',
      smoke: 'No',
      drink: 'Socially',
      lookingFor: 'Relationship',
    };

    // Should match exact attributes
    expect(
      matchesSearchFilters(profile, {
        isFilterActive: true,
        minAge: 20,
        maxAge: 30,
        minHeight: 160,
        maxHeight: 175,
        bodyType: ['Slim'],
        appearance: ['Athletic'],
        language: ['English'],
        smoke: 'No',
        drink: 'Sometimes',
        lookingFor: ['Relationship'],
      })
    ).toBe(true);

    // Should reject if height is out of range
    expect(
      matchesSearchFilters(profile, {
        isFilterActive: true,
        minHeight: 170,
        maxHeight: 180,
      })
    ).toBe(false);

    // Should reject if body type is different
    expect(
      matchesSearchFilters(profile, {
        isFilterActive: true,
        bodyType: ['Muscular'],
      })
    ).toBe(false);

    // Should reject if smoke is different
    expect(
      matchesSearchFilters(profile, {
        isFilterActive: true,
        smoke: 'Yes',
      })
    ).toBe(false);
  });

  it('filterByRadius handles distance calculation and preserves unknown distance profiles', () => {
    const list = [
      { name: 'Mumbai Girl', currentCity: 'Mumbai' },
      { name: 'Unknown Location Girl' },
      { name: 'Bangalore Girl', currentCity: 'Bengaluru' },
    ];

    // Profile in Mumbai (1 km <= 50 km) and unknown location profile (dist null -> kept)
    const filters = { maxDistanceKm: 50, worldwide: false };
    const r1 = filterByRadius(list, filters, null, 'Mumbai, India');
    expect(r1.some(p => p.name === 'Mumbai Girl')).toBe(true);
    expect(r1.some(p => p.name === 'Unknown Location Girl')).toBe(true);

    // Worldwide: true includes everyone
    const rWorldwide = filterByRadius(list, { worldwide: true }, null, 'Mumbai, India');
    expect(rWorldwide.length).toBe(3);
  });
});
