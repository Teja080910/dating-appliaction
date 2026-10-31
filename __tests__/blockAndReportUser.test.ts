import apiClient from '../src/api/apiClient';
import { mockStore } from '../src/mock/mockStore';
import { saveBlockedUser, getLocalBlockedUsers, clearBlockedUsers } from '../src/utils/types/AsyncStorage';

jest.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    getItem: jest.fn(async (key: string) => store[key] || null),
    setItem: jest.fn(async (key: string, val: string) => {
      store[key] = String(val);
    }),
    removeItem: jest.fn(async (key: string) => {
      delete store[key];
    }),
  };
});

describe('Block & Report User Behavior and Discovery Filtering', () => {
  const currentUserId = 'usr_man_101';
  const targetBlockedUserId = 'usr_woman_201';

  beforeAll(async () => {
    await mockStore.init();
    await mockStore.setCurrentUserId(currentUserId);
  });

  beforeEach(async () => {
    await mockStore.unblockUser(currentUserId, targetBlockedUserId);
    await clearBlockedUsers(currentUserId);
  });

  test('POST /users/block blocks target user and returns success', async () => {
    const res = await apiClient.post('/users/block', {
      byUserId: currentUserId,
      targetUserId: targetBlockedUserId,
    });

    expect(res.status).toBe(200);
    expect(res.data.status).toBe('success');

    const blockedList = await mockStore.getBlockedUsers(currentUserId);
    expect(blockedList).toContain(targetBlockedUserId);

    const isBlocked = await mockStore.isUserBlocked(currentUserId, targetBlockedUserId);
    expect(isBlocked).toBe(true);
  });

  test('GET /users/blocked returns list of blocked user IDs', async () => {
    await apiClient.post('/users/block', {
      byUserId: currentUserId,
      targetUserId: targetBlockedUserId,
    });

    const res = await apiClient.get('/users/blocked', {
      params: { userId: currentUserId },
    });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data).toContain(targetBlockedUserId);
  });

  test('Blocked user is removed from Home Feed (/home/{userId} and /dashboard/recent)', async () => {
    // 1. Before block: target is present in discovery
    const beforeRes = await apiClient.get(`/home/${currentUserId}`);
    expect(beforeRes.status).toBe(200);
    const beforeProfiles = beforeRes.data;
    const hasTargetBefore = beforeProfiles.some((p: any) => String(p.userId) === targetBlockedUserId);
    expect(hasTargetBefore).toBe(true);

    // 2. Block the user
    await apiClient.post('/users/block', {
      byUserId: currentUserId,
      targetUserId: targetBlockedUserId,
    });

    // 3. After block: target MUST NOT be present in home feed
    const afterRes = await apiClient.get(`/home/${currentUserId}`);
    expect(afterRes.status).toBe(200);
    const afterProfiles = afterRes.data;
    const hasTargetAfter = afterProfiles.some((p: any) => String(p.userId) === targetBlockedUserId);
    expect(hasTargetAfter).toBe(false);

    // Also check /dashboard/recent
    const recentRes = await apiClient.get('/dashboard/recent', {
      params: { userId: currentUserId },
    });
    expect(recentRes.status).toBe(200);
    const recentProfiles = recentRes.data;
    expect(recentProfiles.some((p: any) => String(p.userId) === targetBlockedUserId)).toBe(false);
  });

  test('Blocked user is removed from Search results (POST /search)', async () => {
    // Block the target user
    await apiClient.post('/users/block', {
      byUserId: currentUserId,
      targetUserId: targetBlockedUserId,
    });

    const searchRes = await apiClient.post('/search', {
      userId: currentUserId,
      gender: ['Female'],
      page: 0,
      size: 30,
    });

    expect(searchRes.status).toBe(200);
    const content = searchRes.data.content;
    const hasTarget = content.some((p: any) => String(p.userId) === targetBlockedUserId);
    expect(hasTarget).toBe(false);
  });

  test('POST /reports/report automatically blocks the reported user', async () => {
    const reportTargetId = 'usr_woman_202';
    await mockStore.unblockUser(currentUserId, reportTargetId);

    const reportRes = await apiClient.post('/reports/report', {
      byUserId: currentUserId,
      targetUserId: reportTargetId,
      reason: 'SPAM_SCAM',
      message: 'Suspicious bot profile',
    });

    expect(reportRes.status).toBe(200);
    expect(reportRes.data.status).toBe('success');

    // Verify target is now in blocked list
    const isBlocked = await mockStore.isUserBlocked(currentUserId, reportTargetId);
    expect(isBlocked).toBe(true);

    // Verify target is removed from search
    const searchRes = await apiClient.post('/search', {
      userId: currentUserId,
      gender: ['Female'],
      page: 0,
      size: 30,
    });
    const content = searchRes.data.content;
    expect(content.some((p: any) => String(p.userId) === reportTargetId)).toBe(false);
  });

  test('AsyncStorage local helpers save and retrieve blocked users', async () => {
    await saveBlockedUser(currentUserId, 'test_blocked_99');
    const list = await getLocalBlockedUsers(currentUserId);
    expect(list).toContain('test_blocked_99');
  });

  test('POST /users/unblock restores user to discovery feed', async () => {
    // Block then unblock
    await apiClient.post('/users/block', {
      byUserId: currentUserId,
      targetUserId: targetBlockedUserId,
    });

    const unblockRes = await apiClient.post('/users/unblock', {
      byUserId: currentUserId,
      targetUserId: targetBlockedUserId,
    });
    expect(unblockRes.status).toBe(200);

    const isBlocked = await mockStore.isUserBlocked(currentUserId, targetBlockedUserId);
    expect(isBlocked).toBe(false);

    const homeRes = await apiClient.get(`/home/${currentUserId}`);
    expect(homeRes.status).toBe(200);
    expect(homeRes.data.some((p: any) => String(p.userId) === targetBlockedUserId)).toBe(true);
  });
});
