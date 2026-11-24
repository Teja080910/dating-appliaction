import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('react-native-razorpay', () => ({ open: jest.fn() }));
jest.mock('react-native-toast-message', () => ({ show: jest.fn() }));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

import SubscriptionModal from '../src/components/SubscriptionModal';
import AppContext from '../src/context/CreateGlobalStateContext';

jest.mock('../src/api/useSubscription', () => ({
  useSubscription: () => ({
    createOrder: { mutateAsync: jest.fn() },
    verifyPayment: { mutateAsync: jest.fn() },
    activateSubscription: { mutateAsync: jest.fn() },
    subscriptionStatus: {
      active: true,
      plan: 'STANDARD',
      remainingDays: 119,
      endDate: '2027-03-05T00:00:00.000Z',
    },
    refetchStatus: jest.fn(),
  }),
  toBackendPlanName: (p: string) => {
    const s = String(p).toUpperCase();
    if (s.includes('ELITE') || s.includes('PLATINUM')) return 'ELITE';
    if (s.includes('PREMIUM') || s.includes('GOLD')) return 'PREMIUM';
    return 'STANDARD';
  },
}));

describe('SubscriptionModal Active Plan Display', () => {
  beforeEach(() => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === 'isSubscribed') return Promise.resolve('true');
      if (key === '@subscription_plan') return Promise.resolve('STANDARD');
      if (key === '@subscription_remainingDays') return Promise.resolve('119');
      if (key === 'userGender') return Promise.resolve('man');
      return Promise.resolve(null);
    });
  });

  test('renders active plan indicators when user has standard plan active', async () => {
    const mockContextValue: any = {
      isSubscribed: true,
      setIsSubscribed: jest.fn(),
      gender: 'man',
    };

    let renderer: any;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <AppContext.Provider value={mockContextValue}>
          <SubscriptionModal visible={true} onClose={jest.fn()} />
        </AppContext.Provider>
      );
    });

    const root = renderer.root;

    // Verify Active Plan text is displayed
    const texts = root.findAllByType('Text').map((t: any) => {
      const child = t.props.children;
      return Array.isArray(child) ? child.join('') : String(child || '');
    });

    const hasActiveBadge = texts.some((t: string) => t.includes('ACTIVE PLAN') || t.includes('ACTIVE'));
    expect(hasActiveBadge).toBe(true);

    const hasStandardPlanTitle = texts.some((t: string) => t.includes('Standard Membership') || t.includes('Standard'));
    expect(hasStandardPlanTitle).toBe(true);

    const hasDaysRemaining = texts.some((t: string) => t.includes('119 days left') || t.includes('119'));
    expect(hasDaysRemaining).toBe(true);

    renderer.unmount();
  });
});
