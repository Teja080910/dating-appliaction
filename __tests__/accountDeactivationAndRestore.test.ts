import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockStore } from '../src/mock/mockStore';
import apiClient from '../src/api/apiClient';
import { isDeletedProfile } from '../src/components/HomeTabComponents/UserList';
import { isDeletedUserRecord } from '../src/api/useDiscovery';
import {
  recordDeletedAccountLocally,
  removeDeletedAccountLocally,
  isAccountPendingDeletion,
  getPendingDeletionUserIdByEmail,
  getLocalDeletedAccounts,
} from '../src/utils/types/AsyncStorage';

describe('Account 30-Day Soft Deletion, Discovery Hiding, and Restoration Flow', () => {
  const testUserId = 'usr_man_101';
  const testUserEmail = 'rahul@amara.com';

  beforeEach(async () => {
    await AsyncStorage.clear();
    await mockStore.resetAll();
    await mockStore.init();
  });

  test('1. POST /account/deactivate hides user from discovery and marks as PENDING_DELETION with 30-day grace period', async () => {
    // Check initial user state
    const userBefore = await mockStore.findUserById(testUserId);
    expect(userBefore).toBeDefined();
    expect((userBefore as any).isActive).not.toBe(false);

    // Call POST /account/deactivate
    const res = await apiClient.post('/account/deactivate', null, {
      params: { userId: testUserId },
    });
    expect(res.status).toBe(200);
    expect(res.data.status).toBe('success');

    // Check user state after deactivation
    const userAfter = await mockStore.findUserById(testUserId);
    expect(userAfter).toBeDefined();
    expect((userAfter as any).isActive).toBe(false);
    expect((userAfter as any).isDeactivated).toBe(true);
    expect((userAfter as any).status).toBe('PENDING_DELETION');
    expect((userAfter as any).deletionDate).toBeDefined();

    // Check that discovery filters hide this user
    expect(isDeletedProfile(userAfter)).toBe(true);
    expect(isDeletedUserRecord(userAfter)).toBe(true);
  });

  test('2. Local storage helpers track 30-day pending deletion and local search suppression', async () => {
    await recordDeletedAccountLocally(testUserId, testUserEmail);

    // Check local deleted accounts list
    const deletedList = await getLocalDeletedAccounts();
    expect(deletedList).toContain(testUserId);

    // Check pending deletion check
    const isPending = await isAccountPendingDeletion(testUserId);
    expect(isPending).toBe(true);

    const pendingByEmail = await getPendingDeletionUserIdByEmail(testUserEmail);
    expect(pendingByEmail).toBe(testUserId);

    // Filter by deletedIds list
    expect(isDeletedProfile({ id: testUserId }, deletedList)).toBe(true);

    // When restored, local markers are removed
    await removeDeletedAccountLocally(testUserId, testUserEmail);
    const deletedListAfter = await getLocalDeletedAccounts();
    expect(deletedListAfter).not.toContain(testUserId);

    const isPendingAfter = await isAccountPendingDeletion(testUserId);
    expect(isPendingAfter).toBe(false);
  });

  test('3. Login within 30 days returns pendingDeletion: true and user can be restored via PUT /account/activate', async () => {
    // Deactivate user
    await apiClient.post('/account/deactivate', null, {
      params: { userId: testUserId },
    });

    // Attempt login within 30 days
    const loginRes = await apiClient.post('/login', {
      email: testUserEmail,
      password: 'Password@123',
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.data.pendingDeletion).toBe(true);
    expect(loginRes.data.user.status).toBe('PENDING_DELETION');
    expect(loginRes.data.user.isDeactivated).toBe(true);

    // User opts to restore: call PUT /account/activate
    const activateRes = await apiClient.put('/account/activate', null, {
      params: { userId: testUserId },
    });
    expect(activateRes.status).toBe(200);
    expect(activateRes.data.status).toBe('success');

    // Verify account is now active again
    const userRestored = await mockStore.findUserById(testUserId);
    expect((userRestored as any).isActive).toBe(true);
    expect((userRestored as any).isDeactivated).toBe(false);
    expect((userRestored as any).status).toBe('ACTIVE');

    // Discovery allows this user again
    expect(isDeletedProfile(userRestored)).toBe(false);
    expect(isDeletedUserRecord(userRestored)).toBe(false);

    // Next login shows normal active state
    const secondLogin = await apiClient.post('/login', {
      email: testUserEmail,
      password: 'Password@123',
    });
    expect(secondLogin.data.pendingDeletion).toBe(false);
    expect(secondLogin.data.user.status).toBe('ACTIVE');
  });

  test('4. After 30 days, backend purges user permanently on login', async () => {
    // Deactivate user with date > 30 days in the past (e.g. 31 days ago)
    await mockStore.deactivateUser(testUserId);
    const user = await mockStore.findUserById(testUserId);
    (user as any).deactivatedAt = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();

    // Login after 30 days should fail with 404 permanently deleted
    await expect(
      apiClient.post('/login', {
        email: testUserEmail,
        password: 'Password@123',
      })
    ).rejects.toThrow();

    // User was permanently purged from store
    const userAfterPurge = await mockStore.findUserById(testUserId);
    expect(userAfterPurge).toBeUndefined();
  });
});
