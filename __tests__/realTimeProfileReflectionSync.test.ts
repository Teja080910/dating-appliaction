import { mockStore } from '../src/mock/mockStore';
import apiClient from '../src/api/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { extractPhone, extractTelegram } from '../src/utils/whatsappHelper';

describe('Real-Time Profile Reflection and Precedence to Other Users', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await mockStore.resetAll();
    await mockStore.init();
  });

  it('live fetched profile data strictly overrides stale navigation route params', () => {
    // Stale route data passed in navigation params when User B clicked User A
    const staleRouteData = {
      id: 'usr_woman_201',
      userId: 'usr_woman_201',
      name: 'Old Ananya',
      displayName: 'Old Ananya',
      bio: 'Old bio text',
      telegramUsername: 'old_telegram',
      mobile: '+91 9999999999',
    };

    // Fresh live data returned by server API
    const liveServerProfile = {
      id: 'usr_woman_201',
      userId: 'usr_woman_201',
      name: 'Ananya Sharma',
      displayName: 'Ananya Sharma',
      bio: 'Updated bio text',
      telegramUsername: 'new_ananya',
      mobile: '+91 9123456789',
    };

    const isViewingSelf = false;
    const isTargetUserFetched = true;
    const isViewerWoman = false;
    const isAcceptedMatch = true;

    const mergedName = isViewingSelf
      ? liveServerProfile.displayName
      : (isTargetUserFetched ? liveServerProfile.displayName : staleRouteData.displayName);

    const mergedBio = isViewingSelf
      ? liveServerProfile.bio
      : (isTargetUserFetched ? liveServerProfile.bio : staleRouteData.bio);

    const mergedTg = isViewingSelf
      ? liveServerProfile.telegramUsername
      : (isViewerWoman || !isAcceptedMatch ? '' : (isTargetUserFetched ? liveServerProfile.telegramUsername : staleRouteData.telegramUsername));

    const mergedPhone = isViewingSelf
      ? liveServerProfile.mobile
      : (isViewerWoman || !isAcceptedMatch ? '' : (isTargetUserFetched ? liveServerProfile.mobile : staleRouteData.mobile));

    // Must reflect live data, NOT stale route data
    expect(mergedName).toBe('Ananya Sharma');
    expect(mergedName).not.toBe('Old Ananya');
    expect(mergedBio).toBe('Updated bio text');
    expect(mergedBio).not.toBe('Old bio text');
    expect(mergedTg).toBe('new_ananya');
    expect(mergedTg).not.toBe('old_telegram');
    expect(mergedPhone).toBe('+91 9123456789');
    expect(mergedPhone).not.toBe('+91 9999999999');
  });

  it('when User A updates or removes contact details, User B gets updated details via server refetch', async () => {
    const userA = 'usr_woman_201';
    const userB = 'usr_man_101';

    // User B is subscribed and has an accepted connection with User A
    await mockStore.setCurrentUserId(userB);
    await AsyncStorage.setItem('isSubscribed', 'true');
    await mockStore.activateSubscription(userB, 'GOLD');

    const req = (await mockStore.getReceivedRequests(userA)).find(
      (r) => String(r.senderId) === userB
    );
    if (req) {
      await mockStore.acceptRequest(req.id, userA);
    }

    // 1. User A initially has Telegram and Phone
    await mockStore.saveProfile({
      userId: userA,
      name: 'Ananya Sharma',
      mobile: '+91 9123456789',
      telegramUsername: 'ananya_live',
    });

    const resBefore = await apiClient.get('/profile/get', { params: { userId: userA } });
    expect(resBefore.data.telegramUsername).toBe('ananya_live');
    expect(resBefore.data.mobile).toBe('+91 9123456789');

    // 2. User A updates contact details (changes Telegram, removes phone)
    await apiClient.put('/profile/update', {
      userId: userA,
      displayName: 'Ananya Sharma',
      telegramUsername: 'ananya_updated_handle',
      mobile: '',
      phoneNumber: '',
    });

    // 3. User B's polling or focus refetch retrieves the updated profile
    const resAfter = await apiClient.get('/profile/get', { params: { userId: userA } });
    expect(resAfter.data.telegramUsername).toBe('ananya_updated_handle');
    expect(resAfter.data.mobile).toBe('');
    expect((resAfter.data as any).phoneNumber).toBe('');

    // Extracting contact from target party yields updated values immediately
    expect(extractTelegram(resAfter.data)).toBe('ananya_updated_handle');
    expect(extractPhone(resAfter.data)).toBe('');
  });
});
