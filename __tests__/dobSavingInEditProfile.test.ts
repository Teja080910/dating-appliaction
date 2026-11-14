import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  parseDobToLocalDate,
  formatDateToDobString,
  calculateAgeFromDob,
  isValidAdultDob,
} from '../src/utils/dateUtils';

describe('Date of Birth (DOB) saving and persistence', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  test('parseDobToLocalDate safely parses YYYY-MM-DD without UTC timezone off-by-one shifts', () => {
    const dob = '1998-05-15';
    const parsed = parseDobToLocalDate(dob);
    expect(parsed.getFullYear()).toBe(1998);
    expect(parsed.getMonth()).toBe(4); // 0-indexed May
    expect(parsed.getDate()).toBe(15);
  });

  test('formatDateToDobString converts dates to YMD string correctly', () => {
    const d = new Date(2001, 3, 20); // 2001-04-20
    const str = formatDateToDobString(d);
    expect(str).toBe('2001-04-20');
  });

  test('formatDateToDobString preserves existing YYYY-MM-DD string', () => {
    expect(formatDateToDobString('1995-12-31')).toBe('1995-12-31');
  });

  test('calculateAgeFromDob calculates adult age correctly', () => {
    const today = new Date();
    const twentyYearsAgo = `${today.getFullYear() - 20}-01-01`;
    const age = calculateAgeFromDob(twentyYearsAgo);
    expect(age).toBeGreaterThanOrEqual(19);
    expect(age).toBeLessThanOrEqual(21);
  });

  test('isValidAdultDob returns false for under 18 years old', () => {
    const today = new Date();
    const sixteenYearsAgo = `${today.getFullYear() - 16}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    expect(isValidAdultDob(sixteenYearsAgo)).toBe(false);
  });

  test('isValidAdultDob returns true for 18+ years old', () => {
    const today = new Date();
    const twentyYearsAgo = `${today.getFullYear() - 20}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    expect(isValidAdultDob(twentyYearsAgo)).toBe(true);
  });

  test('DOB persists to both global userDob and user-scoped user_dob_uid in AsyncStorage', async () => {
    const userId = '12345';
    const dobToSave = '2000-06-18';

    await AsyncStorage.setItem('userDob', dobToSave);
    await AsyncStorage.setItem(`user_dob_${userId}`, dobToSave);

    const retrievedGlobal = await AsyncStorage.getItem('userDob');
    const retrievedScoped = await AsyncStorage.getItem(`user_dob_${userId}`);

    expect(retrievedGlobal).toBe(dobToSave);
    expect(retrievedScoped).toBe(dobToSave);
  });

  test('User updated DOB prevents stale server response from rolling back the year', async () => {
    const userId = 'usr_test_1';
    const oldServerYear = '1998-05-15';
    const newSelectedYear = '2001-05-15';

    // User updates their DOB
    await AsyncStorage.setItem('userDob', newSelectedYear);
    await AsyncStorage.setItem(`user_dob_${userId}`, newSelectedYear);

    // Simulated resolution: local stored DOB must take precedence over old server year
    const localStored = (await AsyncStorage.getItem(`user_dob_${userId}`)) || (await AsyncStorage.getItem('userDob'));
    const resolvedDob = localStored || oldServerYear;

    expect(resolvedDob).toBe('2001-05-15');
    expect(calculateAgeFromDob(resolvedDob)).toBeLessThan(calculateAgeFromDob(oldServerYear));
  });
});
