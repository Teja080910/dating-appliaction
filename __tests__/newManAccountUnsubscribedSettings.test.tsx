import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockStore } from '../src/mock/mockStore';
import ProfileScreen from '../src/screens/ProfileTab/ProfileScreen';
import AppContext from '../src/context/CreateGlobalStateContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    replace: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  }),
  useFocusEffect: jest.fn(),
  useIsFocused: () => true,
}));

jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('react-native-vector-icons/Feather', () => 'Feather');
jest.mock('@react-native-clipboard/clipboard', () => ({
  setString: jest.fn(),
  getString: jest.fn(),
}));

describe('New Man Account Unsubscribed Settings', () => {
  let queryClient: QueryClient;

  beforeEach(async () => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    await AsyncStorage.clear();
  });

  it('newly created man account with no subscription shows ONLY Get Premium in settings', async () => {
    // 1. Create a brand new man account
    const newMan = await mockStore.createUser({
      name: 'Vikas Sharma',
      gender: 'man',
      mobile: '9811223344',
      password: 'Password@123',
    });

    // Verify mockStore has NO subscription for this user
    const sub = await mockStore.getSubscriptionStatus(newMan.userId);
    expect(sub).toBeNull();

    // 2. Render ProfileScreen for this unsubscribed man
    const mockContext: any = {
      isSubscribed: false,
      setIsSubscribed: jest.fn(),
      setPaywallVisible: jest.fn(),
      setViewMyProfile: jest.fn(),
      email: 'vikas@example.com',
      gender: 'man',
      authUserId: newMan.userId,
    };

    let renderer: any;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <QueryClientProvider client={queryClient}>
          <AppContext.Provider value={mockContext}>
            <ProfileScreen />
          </AppContext.Provider>
        </QueryClientProvider>
      );
    });

    const rootStr = JSON.stringify(renderer.toJSON());

    // 3. Must show Get Premium
    expect(rootStr).toContain('Get Premium');

    // 4. Must NOT show any days left or membership
    expect(rootStr).not.toContain('days left');
    expect(rootStr).not.toContain('105d left');
    expect(rootStr).not.toContain('Standard Membership');
  });

  it('does NOT inherit stale un-scoped 105 days left from AsyncStorage when registering a new man', async () => {
    // Simulate stale un-scoped keys left from previous account
    await AsyncStorage.setItem('isSubscribed', 'true');
    await AsyncStorage.setItem('@subscription_plan', 'STANDARD');
    await AsyncStorage.setItem('@subscription_endDate', new Date(Date.now() + 105 * 24 * 60 * 60 * 1000).toISOString());
    await AsyncStorage.setItem('@subscription_remainingDays', '105');

    // Register a new man user
    const newMan = await mockStore.createUser({
      name: 'Rohan Mehra',
      gender: 'man',
      mobile: '9844556677',
      password: 'Password@123',
    });

    // createUser clears stale global subscription keys
    const sub = await mockStore.getSubscriptionStatus(newMan.userId);
    expect(sub).toBeNull();

    const storedSub = await AsyncStorage.getItem(`isSubscribed_${newMan.userId}`);
    expect(storedSub).toBeNull();
  });
});
