import {
  handleNotificationNavigation,
  showForegroundNotificationToast,
  registerDeviceToken,
} from '../src/utils/pushNotificationHelper';
import { navigate } from '../src/utils/navigationHelper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
  hide: jest.fn(),
}));

jest.mock('../src/utils/navigationHelper', () => ({
  navigate: jest.fn(),
  navigationRef: { isReady: () => true, navigate: jest.fn() },
}));

describe('Push Notification Routing & Action Dispatcher', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  test('routes accepted match notification to Sent tab (accepted) for men', async () => {
    await AsyncStorage.setItem('userGender', 'man');

    await handleNotificationNavigation({
      type: 'MATCH',
      notification: {
        title: 'Connection Approved 🎉',
        body: 'Qwerty approved your invite! Telegram username is now available.',
      },
      data: {
        type: 'MATCH',
      },
    });

    expect(navigate).toHaveBeenCalledWith('BottomTabs', {
      screen: 'Sent',
      params: { initialTab: 'accepted' },
    });
  });

  test('routes accepted match notification to Invitations tab (accepted) for women', async () => {
    await AsyncStorage.setItem('userGender', 'woman');

    await handleNotificationNavigation({
      type: 'ACCEPT',
      notification: {
        title: 'Invitation Accepted!',
        body: 'Someone accepted your connection.',
      },
    });

    expect(navigate).toHaveBeenCalledWith('BottomTabs', {
      screen: 'Invitations',
      params: { initialTab: 'accepted' },
    });
  });

  test('routes incoming invitation to Invitations tab (pending) for women', async () => {
    await AsyncStorage.setItem('userGender', 'woman');

    await handleNotificationNavigation({
      notification: {
        title: 'New Connection Request',
        body: 'John sent you a dating request!',
      },
      data: {
        type: 'INVITE',
      },
    });

    expect(navigate).toHaveBeenCalledWith('BottomTabs', {
      screen: 'Invitations',
      params: { initialTab: 'pending' },
    });
  });

  test('routes incoming request to Sent tab (pending) for men', async () => {
    await AsyncStorage.setItem('userGender', 'man');

    await handleNotificationNavigation({
      data: {
        type: 'PROPOSAL',
      },
    });

    expect(navigate).toHaveBeenCalledWith('BottomTabs', {
      screen: 'Sent',
      params: { initialTab: 'pending' },
    });
  });

  test('routes target user profile notification directly to ViewMyProfileScreen', async () => {
    await handleNotificationNavigation({
      data: {
        screen: 'profile',
        userId: '105',
      },
    });

    expect(navigate).toHaveBeenCalledWith('ViewMyProfileScreen', {
      userId: '105',
      targetUserId: '105',
    });
  });

  test('displays foreground notification toast banner when push message arrives', () => {
    const remoteMessage = {
      notification: {
        title: 'New Date Proposal',
        body: 'You received a new proposal from Sophia!',
      },
      data: {
        type: 'INVITE',
      },
    };

    showForegroundNotificationToast(remoteMessage);

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'info',
        text1: 'New Date Proposal',
        text2: 'You received a new proposal from Sophia!',
      })
    );

    // Verify pressing toast navigates to target
    const toastArgs = (Toast.show as jest.Mock).mock.calls[0][0];
    toastArgs.onPress();

    expect(Toast.hide).toHaveBeenCalled();
  });

  test('registers device token with backend', async () => {
    const success = await registerDeviceToken('101');
    expect(success).toBe(true);
  });
});
