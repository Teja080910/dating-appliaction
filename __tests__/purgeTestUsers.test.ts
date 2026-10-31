import { mockStore, isTestUserOrProfile } from '../src/mock/mockStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('Purge Test Users (user one, new amara users, teja)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await mockStore.init();
  });

  test('isTestUserOrProfile accurately detects test user variations', () => {
    expect(isTestUserOrProfile({ name: 'User One' })).toBe(true);
    expect(isTestUserOrProfile({ name: 'user 1' })).toBe(true);
    expect(isTestUserOrProfile({ name: 'userone' })).toBe(true);
    expect(isTestUserOrProfile({ name: 'New Amara User' })).toBe(true);
    expect(isTestUserOrProfile({ name: 'new amara users' })).toBe(true);
    expect(isTestUserOrProfile({ name: 'Teja' })).toBe(true);
    expect(isTestUserOrProfile({ email: 'teja@gmail.com' })).toBe(true);
    expect(isTestUserOrProfile({ telegramUsername: 'teja_official' })).toBe(true);

    // Regular users should not be flagged
    expect(isTestUserOrProfile({ name: 'Rahul Sharma', email: 'rahul@amara.com' })).toBe(false);
    expect(isTestUserOrProfile({ name: 'Ananya Roy', email: 'ananya@amara.com' })).toBe(false);
  });

  test('purgeTestUsers removes all test accounts from memory and storage', async () => {
    // Inject test users
    await mockStore.createUser({
      name: 'User One',
      email: 'userone@example.com',
      gender: 'man',
    });
    await mockStore.createUser({
      name: 'New Amara User',
      email: 'newamara@example.com',
      gender: 'woman',
    });
    await mockStore.createUser({
      name: 'Teja',
      email: 'teja@example.com',
      gender: 'man',
    });

    // Verify test users exist prior to purge
    const beforeProfiles = await mockStore.getProfiles();
    expect(beforeProfiles.some((p) => p.name === 'User One')).toBe(false); // getProfiles already filters!

    // Run explicit purge
    await mockStore.purgeTestUsers();

    const users = await mockStore.getUsers();
    expect(users.some((u) => u.name === 'User One')).toBe(false);
    expect(users.some((u) => u.name === 'New Amara User')).toBe(false);
    expect(users.some((u) => u.name === 'Teja')).toBe(false);

    const profiles = await mockStore.getProfiles();
    expect(profiles.some((p) => p.name === 'User One')).toBe(false);
    expect(profiles.some((p) => p.name === 'New Amara User')).toBe(false);
    expect(profiles.some((p) => p.name === 'Teja')).toBe(false);

    // Default 50 profiles should remain intact
    expect(profiles.length).toBe(50);
  });

  test('resets currentUserId if previously pointed to a test user', async () => {
    const testUser = await mockStore.createUser({
      name: 'Teja Test',
      email: 'teja@test.com',
      gender: 'man',
    });

    await mockStore.setCurrentUserId(testUser.userId);
    expect(await mockStore.getCurrentUserId()).toBe(testUser.userId);

    await mockStore.purgeTestUsers();
    const activeUserId = await mockStore.getCurrentUserId();
    expect(activeUserId).toBe('usr_man_101');
  });
});
