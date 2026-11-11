import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

const mockNavigation = {
  navigate: jest.fn(),
  replace: jest.fn(),
  goBack: jest.fn(),
  canGoBack: jest.fn(() => true),
};

const mockRoute = {
  params: {
    initialTab: 'accepted',
  },
};

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
  useIsFocused: () => true,
  useNavigation: () => mockNavigation,
  useRoute: () => mockRoute,
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async (key: string) => {
    if (key === 'userGender' || key === 'selectedGender') return 'woman';
    return null;
  }),
  setItem: jest.fn(async () => null),
  multiGet: jest.fn(async () => []),
  multiSet: jest.fn(async () => null),
  multiRemove: jest.fn(async () => null),
  removeItem: jest.fn(async () => null),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 20, bottom: 20, left: 0, right: 0 }),
  SafeAreaView: ({ children }: any) => children,
}));

jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('react-native-vector-icons/Feather', () => 'Feather');
jest.mock('../src/components/NotificationBanner', () => 'NotificationBanner');
jest.mock('../src/utils/geolocation', () => ({
  getCurrentLocation: jest.fn(() => Promise.resolve({ latitude: 12.7937, longitude: 77.5085 })),
}));

const mockAcceptMutateAsync = jest.fn();
const mockRejectMutateAsync = jest.fn();
const mockRefreshAll = jest.fn();

const sampleAcceptedRequest = {
  id: 'req_123',
  status: 'ACCEPTED',
  createdAt: '2026-11-01T10:00:00Z',
  sender: {
    id: 'usr_man_101',
    name: 'Rahul Sharma',
    displayName: 'Rahul Sharma',
    photo: 'https://example.com/rahul.jpg',
    phoneNumber: '+91 9876543210',
    telegramUsername: 'rahul_amara',
  },
};

const samplePendingRequest = {
  id: 'req_124',
  status: 'PENDING',
  createdAt: '2026-11-02T10:00:00Z',
  sender: {
    id: 'usr_man_102',
    name: 'Amit Patel',
    displayName: 'Amit Patel',
    photo: 'https://example.com/amit.jpg',
    phoneNumber: '+91 9123456780',
    telegramUsername: 'amit_amara',
  },
};

jest.mock('../src/api/useConnection', () => ({
  useConnection: () => ({
    receivedList: {
      data: [sampleAcceptedRequest, samplePendingRequest],
      isLoading: false,
      isRefetching: false,
    },
    sentList: {
      data: [],
      isLoading: false,
      isRefetching: false,
    },
    accept: {
      mutateAsync: mockAcceptMutateAsync,
      mutate: jest.fn(),
      isPending: false,
    },
    reject: {
      mutateAsync: mockRejectMutateAsync,
      mutate: jest.fn(),
      isPending: false,
    },
    refreshAll: mockRefreshAll,
  }),
}));

import AppContext from '../src/context/CreateGlobalStateContext';
import RequestsInboxScreen from '../src/screens/RequestsTab/RequestsInboxScreen';
import UserDetails from '../src/components/ProfileTabComponents/ViewMyProfile/UserDetails';

describe('Glambu Female Contact Privacy Requirements', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    jest.clearAllMocks();
  });

  test('1. Female Accepted tab displays "He will contact you" and Accepted badge, with NO WhatsApp/Telegram buttons', async () => {
    let renderer: any;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <QueryClientProvider client={queryClient}>
          <AppContext.Provider
            value={
              {
                gender: 'woman',
                isSubscribed: false,
                setViewMyProfile: jest.fn(),
                setCardUserName: jest.fn(),
                setCardUserAge: jest.fn(),
                setSelectedUserImage: jest.fn(),
                setPaywallVisible: jest.fn(),
              } as any
            }
          >
            <RequestsInboxScreen />
          </AppContext.Provider>
        </QueryClientProvider>
      );
    });

    const root = renderer.root;
    const textNodes = root.findAllByType('Text').map((node: any) => {
      const children = Array.isArray(node.props.children)
        ? node.props.children.join('')
        : String(node.props.children || '');
      return children;
    });

    // Verify Glambu requirement: woman sees "He will contact you"
    const hasHeWillContact = textNodes.some((t: string) =>
      t.includes('He will contact you')
    );
    expect(hasHeWillContact).toBe(true);

    // Verify Accepted badge exists
    const hasAcceptedBadge = textNodes.some((t: string) => t === 'Accepted');
    expect(hasAcceptedBadge).toBe(true);

    // Verify male's phone number or Telegram username is NOT displayed on the card
    expect(textNodes.some((t: string) => t.includes('+91 9876543210'))).toBe(false);
    expect(textNodes.some((t: string) => t.includes('@rahul_amara'))).toBe(false);

    // Verify NO WhatsApp or Telegram action buttons for the woman on accepted cards
    const whatsAppBtns = root.findAll((node: any) =>
      node.props?.style?.backgroundColor === '#25D366'
    );
    const telegramBtns = root.findAll((node: any) =>
      node.props?.style?.backgroundColor === '#0088cc'
    );
    expect(whatsAppBtns.length).toBe(0);
    expect(telegramBtns.length).toBe(0);
  });

  test('2. Female UserDetails on accepted match displays Glambu notice and hides male contact details', async () => {
    let renderer: any;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <QueryClientProvider client={queryClient}>
          <AppContext.Provider
            value={
              {
                gender: 'woman',
                isSubscribed: false,
              } as any
            }
          >
            <UserDetails
              profile={{
                id: 'usr_man_101',
                displayName: 'Rahul Sharma',
                phoneNumber: '+91 9876543210',
                telegramUsername: 'rahul_amara',
                requestStatus: 'ACCEPTED',
              }}
              currentUserId="usr_woman_201"
              targetUserId="usr_man_101"
              requestId="req_123"
              requestRole="received"
              requestStatus="ACCEPTED"
            />
          </AppContext.Provider>
        </QueryClientProvider>
      );
    });

    const root = renderer.root;
    const textNodes = root.findAllByType('Text').map((node: any) => {
      const children = Array.isArray(node.props.children)
        ? node.props.children.join('')
        : String(node.props.children || '');
      return children;
    });

    // Should see Glambu accepted notice
    expect(
      textNodes.some((t: string) => t.includes('Invitation Accepted'))
    ).toBe(true);
    expect(
      textNodes.some((t: string) =>
        t.includes('Your contact details have been shared with him. He will contact you on WhatsApp or Telegram')
      )
    ).toBe(true);

    // Should NOT expose male's WhatsApp or Telegram
    expect(textNodes.some((t: string) => t.includes('+91 9876543210'))).toBe(false);
    expect(textNodes.some((t: string) => t.includes('@rahul_amara'))).toBe(false);
  });
});
