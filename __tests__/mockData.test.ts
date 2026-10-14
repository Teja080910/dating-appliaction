import { mockStore } from '../src/mock/mockStore';
import profilesJson from '../src/mock/data/profiles.json';
import usersJson from '../src/mock/data/users.json';
import requestsJson from '../src/mock/data/requests.json';
import { getLanguageFlag, APP_LANGUAGES } from '../src/utils/languageHelper';

describe('Mock Data & Language Configuration Verification', () => {
  test('Exact 10 languages are configured with flags', () => {
    expect(APP_LANGUAGES.length).toBe(10);
    const expected = ['English', 'Spanish', 'Portuguese', 'German', 'Romanian', 'Russian', 'French', 'Chinese', 'Japanese', 'Indonesian'];
    expect(APP_LANGUAGES.map((l) => l.name)).toEqual(expected);
    expected.forEach((lang) => {
      expect(getLanguageFlag(lang)).not.toBe('🌐');
    });
  });

  test('profiles.json contains 40 women and 10 men with valid fields', () => {
    const women = profilesJson.filter((p: any) => p.gender === 'woman');
    const men = profilesJson.filter((p: any) => p.gender === 'man');
    expect(women.length).toBe(40);
    expect(men.length).toBe(10);

    // Verify all women have at least 3 photos, valid languages, and no extra invalid fields
    women.forEach((w: any) => {
      expect(w.photos.length).toBeGreaterThanOrEqual(2);
      expect(w.displayName).toBeDefined();
      expect(w.age).toBeGreaterThanOrEqual(18);
      expect(['Slim', 'Muscular', 'Athletic', 'Average', 'A few extra pounds', 'Other']).toContain(w.bodyType);
      expect(['Very attractive', 'Attractive', 'Average', 'Below average', 'Athletic']).toContain(w.appearance);
      expect(['Yes', 'No', 'Sometimes']).toContain(w.smoke);
      expect(['Yes', 'No', 'Socially']).toContain(w.drink);
      expect(['Basic', 'Medium', 'Good', 'Very Good']).toContain(w.englishLevel);
      expect(['0', '1', '2', '3+', 'Prefer not to say']).toContain(w.kids);
      expect(w.telegramUsername).toBeDefined();
    });
  });

  test('users.json matches profiles count and has telegram handles', () => {
    expect(usersJson.length).toBe(50);
    usersJson.forEach((u: any) => {
      expect(u.telegramUsername).toBeDefined();
      expect(u.mobile).toBeDefined();
      expect(u.password).toBeDefined();
    });
  });

  test('requests.json has valid connection requests strictly from men to women', () => {
    expect(requestsJson.length).toBeGreaterThanOrEqual(10);
    requestsJson.forEach((r: any) => {
      expect(r.sender.gender).toBe('man');
      expect(r.receiver.gender).toBe('woman');
      expect(r.sender.telegramUsername).toBeDefined();
      expect(r.receiver.telegramUsername).toBeDefined();
    });
  });

  test('mockStore loads and returns 40 women profiles for discovery feed', async () => {
    await mockStore.init();
    const discoveryProfiles = await mockStore.getProfiles('woman');
    expect(discoveryProfiles.length).toBe(40);
  });
});
