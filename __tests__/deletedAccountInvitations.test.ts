import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockStore } from '../src/mock/mockStore';
import apiClient from '../src/api/apiClient';

describe('Invitation tabs respect 30-day account deletion and restoration', () => {
  const senderId = 'usr_man_101';
  const receiverId = 'usr_woman_201';

  beforeEach(async () => {
    await AsyncStorage.clear();
    await mockStore.resetAll();
    await mockStore.init();
  });

  test('a deactivated sender is hidden from received invitations and returns after restore', async () => {
    let res = await apiClient.get('/connections/received', {
      params: { userId: receiverId },
    });
    let ids = (res.data || []).map((r: any) => String(r.id));
    expect(ids).toContain('req_101_201');

    await mockStore.deactivateUser(senderId);

    res = await apiClient.get('/connections/received', {
      params: { userId: receiverId },
    });
    ids = (res.data || []).map((r: any) => String(r.id));
    expect(ids).not.toContain('req_101_201');

    // Logging back in within the 30-day window restores the account.
    await mockStore.activateUser(senderId);

    res = await apiClient.get('/connections/received', {
      params: { userId: receiverId },
    });
    ids = (res.data || []).map((r: any) => String(r.id));
    expect(ids).toContain('req_101_201');
  });

  test('a deactivated receiver is hidden from sent invitations and returns after restore', async () => {
    let res = await apiClient.get('/connections/sent', {
      params: { userId: senderId },
    });
    let ids = (res.data || []).map((r: any) => String(r.id));
    expect(ids).toContain('req_101_201');

    await mockStore.deactivateUser(receiverId);

    res = await apiClient.get('/connections/sent', {
      params: { userId: senderId },
    });
    ids = (res.data || []).map((r: any) => String(r.id));
    expect(ids).not.toContain('req_101_201');

    await mockStore.activateUser(receiverId);

    res = await apiClient.get('/connections/sent', {
      params: { userId: senderId },
    });
    ids = (res.data || []).map((r: any) => String(r.id));
    expect(ids).toContain('req_101_201');
  });

  test('a deactivated account is excluded from discover/search and returns after restore', async () => {
    const search = async () => {
      const res = await apiClient.post('/search', {
        gender: 'man',
        userId: receiverId,
        page: 0,
        size: 50,
      });
      const list = Array.isArray(res.data) ? res.data : res.data?.content || [];
      return list.map((p: any) => String(p.userId || p.id));
    };

    let ids = await search();
    expect(ids).toContain(senderId);

    await mockStore.deactivateUser(senderId);
    ids = await search();
    expect(ids).not.toContain(senderId);

    // Login within 30 days restores the account.
    await mockStore.activateUser(senderId);
    ids = await search();
    expect(ids).toContain(senderId);
  });
});
