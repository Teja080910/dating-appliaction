import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockStore } from '../src/mock/mockStore';

describe('Multi-Female Connection Isolation (Per-Request Acceptance)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await mockStore.resetAll();
  });

  it('accepting a male request on Female A does NOT auto-accept a request from the same male on Female B', async () => {
    const maleId = 'usr_man_101';
    const femaleAId = 'usr_woman_201';
    const femaleBId = 'usr_woman_202';

    // 1. Initial requests in seed mockStore:
    // req_101_201 is to femaleA (usr_woman_201), status PENDING
    // req_101_202 is to femaleB (usr_woman_202), status PENDING
    await mockStore.init();

    const reqA = (await mockStore.getReceivedRequests(femaleAId)).find(
      (r) => String(r.senderId) === maleId
    );
    expect(reqA).toBeDefined();
    expect(reqA?.status).toBe('PENDING');

    const reqBBefore = (await mockStore.getReceivedRequests(femaleBId)).find(
      (r) => String(r.senderId) === maleId
    );
    expect(reqBBefore).toBeDefined();
    expect(reqBBefore?.status).toBe('PENDING');

    // 2. Female A accepts Male 101's request
    await mockStore.acceptRequest(reqA!.id, femaleAId);

    // Verify Female A's request is now APPROVED
    const reqAAfter = (await mockStore.getReceivedRequests(femaleAId)).find(
      (r) => String(r.id) === String(reqA!.id)
    );
    expect(reqAAfter?.status).toBe('APPROVED');

    // 3. Female B logs in / checks her requests:
    // Female B's request from Male 101 MUST STILL BE PENDING!
    const reqBAfter = (await mockStore.getReceivedRequests(femaleBId)).find(
      (r) => String(r.senderId) === maleId
    );
    expect(reqBAfter).toBeDefined();
    expect(reqBAfter?.status).toBe('PENDING');

    // 4. Also check getConnectionStatus between Male 101 and Female B
    const statusB = await mockStore.getConnectionStatus(maleId, femaleBId);
    expect(statusB).toBe('PENDING');

    // 5. Check getConnectionStatus between Male 101 and Female A
    const statusA = await mockStore.getConnectionStatus(maleId, femaleAId);
    expect(statusA).toBe('APPROVED');
  });

  it('a newly sent request from Male 101 to Female B remains PENDING after Female A accepted a previous request', async () => {
    const maleId = 'usr_man_101';
    const femaleAId = 'usr_woman_201';
    const femaleNewId = 'usr_woman_206'; // Seed request is PENDING

    await mockStore.init();

    // Female A accepts request from Male 101
    const reqA = (await mockStore.getReceivedRequests(femaleAId)).find(
      (r) => String(r.senderId) === maleId
    );
    expect(reqA).toBeDefined();
    await mockStore.acceptRequest(reqA!.id, femaleAId);

    // Re-initialize mockStore (simulating app reload or re-login as Female 206)
    await mockStore.init();

    const reqNew = (await mockStore.getReceivedRequests(femaleNewId)).find(
      (r) => String(r.senderId) === maleId
    );
    expect(reqNew).toBeDefined();
    expect(reqNew?.status).toBe('PENDING');

    const statusNew = await mockStore.getConnectionStatus(maleId, femaleNewId);
    expect(statusNew).toBe('PENDING');
  });

  it('rejecting Male 101 on Female B does not affect accepted status on Female A', async () => {
    const maleId = 'usr_man_101';
    const femaleAId = 'usr_woman_201';
    const femaleBId = 'usr_woman_202';

    await mockStore.init();

    // Female A accepts
    const reqA = (await mockStore.getReceivedRequests(femaleAId)).find(
      (r) => String(r.senderId) === maleId
    );
    await mockStore.acceptRequest(reqA!.id, femaleAId);

    // Female B declines
    const reqB = (await mockStore.getReceivedRequests(femaleBId)).find(
      (r) => String(r.senderId) === maleId
    );
    await mockStore.cancelOrDeclineRequest(reqB!.id);

    // Female A's connection is still APPROVED
    const statusA = await mockStore.getConnectionStatus(maleId, femaleAId);
    expect(statusA).toBe('APPROVED');
  });
});
