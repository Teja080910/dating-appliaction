import { mockStore } from '../src/mock/mockStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('Accepted male invitations retention on refresh', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await mockStore.resetAll();
  });

  it('keeps accepted male requests with APPROVED status after mockStore re-initializes / refreshes', async () => {
    // 1. Initial state for female user usr_woman_201
    const initialReceived = await mockStore.getReceivedRequests('usr_woman_201');
    const pendingReq = initialReceived.find((r) => r.status === 'PENDING' && r.senderId === 'usr_man_101');
    expect(pendingReq).toBeDefined();

    // 2. Female user accepts the request
    const approved = await mockStore.acceptRequest(pendingReq!.id, 'usr_woman_201');
    expect(approved.status).toBe('APPROVED');

    // Verify it is now approved in current in-memory store
    const afterAccept = await mockStore.getReceivedRequests('usr_woman_201');
    const acceptedInStore = afterAccept.find((r) => r.id === pendingReq!.id);
    expect(acceptedInStore?.status).toBe('APPROVED');

    // 3. Simulate app refresh / reload: reset in-memory initialized flag and call init()
    (mockStore as any).initialized = false;
    await mockStore.init();

    // 4. Verify the accepted invitation is STILL approved and NOT reverted to PENDING
    const afterRefresh = await mockStore.getReceivedRequests('usr_woman_201');
    const acceptedAfterRefresh = afterRefresh.find((r) => r.id === pendingReq!.id);
    expect(acceptedAfterRefresh?.status).toBe('APPROVED');

    // 5. Verify it appears in approved connections
    const approvedList = await mockStore.getApprovedConnections('usr_woman_201');
    expect(approvedList.some((r) => r.id === pendingReq!.id)).toBe(true);
  });
});
