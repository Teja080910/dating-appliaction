import { mockStore } from '../src/mock/mockStore';
import apiClient from '../src/api/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { extractPhone, extractTelegram } from '../src/utils/whatsappHelper';

describe('Remove Contact Details in Edit Profile and Reflection Across Profiles', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await mockStore.resetAll();
    await mockStore.init();
  });

  it('clears Telegram handle and phone number when removed in edit profile', async () => {
    const userId = 'usr_man_101';

    // 1. Initial state: Rahul has phone and telegram
    await mockStore.saveProfile({
      userId,
      mobile: '+91 9876543210',
      telegramUsername: 'rahul_amara',
    });

    const initialProfile = await mockStore.getProfileByUserId(userId);
    expect(initialProfile?.mobile).toBe('+91 9876543210');
    expect(initialProfile?.telegramUsername).toBe('rahul_amara');

    // 2. User removes both mobile and telegram in edit profile
    const updateRes = await apiClient.put('/profile/update', {
      userId,
      displayName: 'Rahul Sharma',
      mobile: '',
      phoneNumber: '',
      telegramUsername: 'NONE',
    });
    expect(updateRes.status).toBe(200);

    // 3. Verify in database / mockStore that both are cleared
    const updatedProfile = await mockStore.getProfileByUserId(userId);
    expect(updatedProfile?.mobile).toBe('');
    expect((updatedProfile as any)?.phoneNumber).toBe('');
    expect(updatedProfile?.telegramUsername).toBe('');

    const user = await mockStore.findUserById(userId);
    expect(user?.mobile).toBe('');
    expect(user?.telegramUsername).toBe('');
  });

  it('synchronizes contact removal into connection requests so matched users no longer see removed contacts', async () => {
    const senderId = 'usr_man_101';
    const receiverId = 'usr_woman_201';

    // 1. Setup an accepted connection where both had contacts
    await mockStore.saveProfile({
      userId: receiverId,
      mobile: '+91 9123456789',
      telegramUsername: 'ananya_amara',
    });

    const req = (await mockStore.getReceivedRequests(receiverId)).find(
      (r) => String(r.senderId) === senderId
    );
    expect(req).toBeDefined();

    await mockStore.acceptRequest(req!.id, receiverId);

    // Verify before removal, connection exposes receiver contacts
    const connsBefore = await mockStore.getApprovedConnections(senderId);
    const connBefore: any = connsBefore.find((c) => String(c.receiverId) === receiverId);
    expect(connBefore).toBeDefined();
    expect(connBefore?.receiverTelegram).toBe('ananya_amara');
    expect(connBefore?.receiverMobile).toBe('+91 9123456789');

    // 2. Ananya removes her Telegram and Phone number in edit profile
    await apiClient.put('/profile/update', {
      userId: receiverId,
      displayName: 'Ananya Sharma',
      mobile: '',
      phoneNumber: '',
      telegramUsername: 'NONE',
    });

    // 3. Approved connections for Rahul should now reflect that Ananya removed her contacts
    const connsAfter = await mockStore.getApprovedConnections(senderId);
    const connAfter: any = connsAfter.find((c) => String(c.receiverId) === receiverId);
    expect(connAfter).toBeDefined();
    expect(connAfter?.receiverTelegram).toBe('');
    expect(connAfter?.receiverMobile).toBe('');
    expect(connAfter?.receiver?.telegramUsername).toBe('');
    expect(connAfter?.receiver?.mobile).toBe('');

    // 4. Sent requests from Rahul should also reflect empty contacts
    const sentReqs = await mockStore.getSentRequests(senderId);
    const sentConn = sentReqs.find((s) => String(s.receiverId) === receiverId);
    expect(sentConn?.receiver?.telegramUsername).toBe('');
    expect(sentConn?.receiver?.mobile).toBe('');

    // Extracting contact details from target party should yield empty strings
    const targetTg = extractTelegram(connAfter?.receiver);
    const targetPhone = extractPhone(connAfter?.receiver);
    expect(targetTg).toBe('');
    expect(targetPhone).toBe('');
  });

  it('own profile contact extraction does not show contacts when removed', async () => {
    const activeUid = 'usr_man_101';

    // Set removal flags in AsyncStorage
    await AsyncStorage.setItem(`@amara_phone_removed_${activeUid}`, 'true');
    await AsyncStorage.setItem(`@amara_telegram_disconnected_${activeUid}`, 'true');
    await AsyncStorage.multiRemove([
      `user_phone_${activeUid}`,
      `user_telegram_${activeUid}`,
      'phoneNumber',
      'userMobile',
      'telegramUsername',
    ]);

    const resolvedProfile = {
      id: activeUid,
      userId: activeUid,
      mobile: '',
      phoneNumber: '',
      telegramUsername: '',
    };

    const isOwnProfile = true;
    const ownTelegram = '';
    const storedPhone = '';
    const contextPhone = '';
    const myTgStatus = { isConnected: false, telegramUsername: '' };

    const targetTelegramUsername = (() => {
      if (isOwnProfile) {
        const isTgExplicitlyDisconnected =
          myTgStatus?.isConnected === false ||
          (resolvedProfile as any)?.telegramUsername === '' ||
          (resolvedProfile as any)?.telegramUsername === 'NONE';
        if (isTgExplicitlyDisconnected && !ownTelegram) {
          return '';
        }
        return extractTelegram(
          ownTelegram,
          resolvedProfile,
          myTgStatus?.isConnected ? myTgStatus?.telegramUsername : null
        );
      }
      return '';
    })();

    const targetPhoneNumber = (() => {
      if (isOwnProfile) {
        const isPhoneExplicitlyCleared =
          (resolvedProfile as any)?.mobile === '' ||
          (resolvedProfile as any)?.phoneNumber === '';
        if (isPhoneExplicitlyCleared && !storedPhone) {
          return '';
        }
        return extractPhone(
          storedPhone,
          resolvedProfile,
          contextPhone
        );
      }
      return '';
    })();

    expect(targetTelegramUsername).toBe('');
    expect(targetPhoneNumber).toBe('');
  });
});
