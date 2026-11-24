import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearAuthSession } from '../src/utils/sessionState';

describe('clearAuthSession removes cross-account profile identity', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('wipes DOB, name, bio and cached profile attributes from the previous account', async () => {
    await AsyncStorage.multiSet([
      ['userId', 'OLDUSER1'],
      ['userDob', '1990-01-01'],
      ['user_dob_OLDUSER1', '1990-01-01'],
      ['name', 'Old Name'],
      ['displayName', 'Old Name'],
      ['userName', 'Old Name'],
      ['bio', 'Old bio'],
      ['userBio', 'Old bio'],
      ['profileText', 'Old bio'],
      ['@onboarding_bio', 'Old bio'],
      ['@amara_height', '170'],
      ['@amara_body_type', 'Slim'],
      ['@amara_net_worth', 'Below 50k'],
    ]);

    await clearAuthSession();

    const remainingKeys = await AsyncStorage.getAllKeys();
    expect(remainingKeys).not.toContain('userDob');
    expect(remainingKeys).not.toContain('user_dob_OLDUSER1');
    expect(remainingKeys).not.toContain('name');
    expect(remainingKeys).not.toContain('displayName');
    expect(remainingKeys).not.toContain('userName');
    expect(remainingKeys).not.toContain('bio');
    expect(remainingKeys).not.toContain('userBio');
    expect(remainingKeys).not.toContain('profileText');
    expect(remainingKeys).not.toContain('@onboarding_bio');
    expect(remainingKeys).not.toContain('@amara_height');
    expect(remainingKeys).not.toContain('@amara_body_type');
    expect(remainingKeys).not.toContain('@amara_net_worth');
  });
});
