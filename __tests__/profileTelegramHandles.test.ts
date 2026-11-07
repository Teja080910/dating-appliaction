import { extractTelegram, extractPhone } from '../src/utils/whatsappHelper';
import { mockStore } from '../src/mock/mockStore';

describe('Profile-wise Telegram and Phone Segregation', () => {
  beforeAll(async () => {
    await mockStore.init();
  });

  test('extractTelegram retrieves exact handle from individual profile objects', () => {
    const priyaProfile = { id: 'usr_woman_202', name: 'Priya Sen', telegramUsername: 'priya_sen' };
    const rheaProfile = { id: 'usr_woman_203', name: 'Rhea Kapoor', telegramUsername: 'rhea_kapoor' };
    const rahulProfile = { id: 'usr_man_101', name: 'Rahul Sharma', telegramUsername: 'rahul_amara' };

    expect(extractTelegram(priyaProfile)).toBe('priya_sen');
    expect(extractTelegram(rheaProfile)).toBe('rhea_kapoor');
    expect(extractTelegram(rahulProfile)).toBe('rahul_amara');
  });

  test('each mock profile in mockStore has its own unique telegram handle', async () => {
    const p1 = await mockStore.getProfileByUserId('usr_woman_201');
    const p2 = await mockStore.getProfileByUserId('usr_woman_202');
    const p3 = await mockStore.getProfileByUserId('usr_woman_203');
    const p4 = await mockStore.getProfileByUserId('usr_woman_204');
    const m1 = await mockStore.getProfileByUserId('usr_man_101');

    expect(p1?.telegramUsername).toBe('ananya_amara');
    expect(p2?.telegramUsername).toBe('priya_sen');
    expect(p3?.telegramUsername).toBe('rhea_kapoor');
    expect(p4?.telegramUsername).toBe('natasha_m');
    expect(m1?.telegramUsername).toBe('rahul_amara');

    // All must be distinct
    const handles = [
      p1?.telegramUsername,
      p2?.telegramUsername,
      p3?.telegramUsername,
      p4?.telegramUsername,
      m1?.telegramUsername,
    ];
    const unique = new Set(handles);
    expect(unique.size).toBe(5);
  });

  test('sent request approved connection exposes receiver telegram to sender', async () => {
    // Approve req_101_201 where Rahul is sender and Ananya is receiver
    await mockStore.acceptRequest('req_101_201');

    // Rahul checks his sent requests
    const sent = await mockStore.getSentRequests('usr_man_101');
    const ananyaConn = sent.find((s) => String(s.receiverId) === 'usr_woman_201');
    expect(ananyaConn).toBeDefined();

    // The receiver's telegram must be Ananya's, not Rahul's
    const targetTg = extractTelegram(ananyaConn?.receiver);
    expect(targetTg).toBe('ananya_amara');
    expect(targetTg).not.toBe('rahul_amara');
  });

  test('received request approved connection exposes sender telegram to receiver', async () => {
    // Approve req_101_201 where Rahul is sender and Ananya is receiver
    await mockStore.acceptRequest('req_101_201');

    // Ananya checks her received requests
    const received = await mockStore.getReceivedRequests('usr_woman_201');
    const rahulConn = received.find((r) => String(r.senderId) === 'usr_man_101');
    expect(rahulConn).toBeDefined();

    // The sender's telegram must be Rahul's, not Ananya's
    const targetTg = extractTelegram(rahulConn?.sender);
    expect(targetTg).toBe('rahul_amara');
    expect(targetTg).not.toBe('ananya_amara');
  });

  test('extractPhone extracts mobile number across various API key conventions', () => {
    expect(extractPhone({ mobile: '+91 9876543210' })).toBe('+91 9876543210');
    expect(extractPhone({ phoneNumber: '+1 4155552671' })).toBe('+1 4155552671');
    expect(extractPhone({ phone: '9876543210' })).toBe('9876543210');
    expect(extractPhone({ mobileNumber: '+44 7911 123456' })).toBe('+44 7911 123456');
    expect(extractPhone({ user: { mobile: '+91 9999988888' } })).toBe('+91 9999988888');
    expect(extractPhone({ profile: { phoneNumber: '+91 7777766666' } })).toBe('+91 7777766666');
  });

  test('updating mobile number in profile stores and returns phone details correctly', async () => {
    const updated = await mockStore.saveProfile({
      userId: 'usr_man_101',
      mobile: '+91 9876543210',
    });
    expect(updated.mobile).toBe('+91 9876543210');
    expect(updated.phoneNumber).toBe('+91 9876543210');
    expect((updated as any).mobileNumber).toBe('+91 9876543210');

    const fetched = await mockStore.getProfileByUserId('usr_man_101');
    expect(fetched?.mobile).toBe('+91 9876543210');
    expect(extractPhone(fetched)).toBe('+91 9876543210');
  });

  test('findUserByTelegram detects already connected telegram handle across different profiles', async () => {
    // usr_woman_201 has 'ananya_amara'
    const found = await mockStore.findUserByTelegram('ananya_amara', 'usr_man_102');
    expect(found).toBeDefined();
    expect(found?.userId || found?.id).toBe('usr_woman_201');

    // Case insensitivity & leading @ stripping
    const foundWithAt = await mockStore.findUserByTelegram('@Ananya_Amara', 'usr_man_102');
    expect(foundWithAt).toBeDefined();

    // Excluding the user itself should return null
    const sameUser = await mockStore.findUserByTelegram('ananya_amara', 'usr_woman_201');
    expect(sameUser).toBeNull();

    // Unused handle should return null
    const notFound = await mockStore.findUserByTelegram('unused_random_handle_99', 'usr_man_102');
    expect(notFound).toBeNull();
  });
});
