import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ResetLocationScreen from '../src/screens/ProfileTab/ResetLocationScreen';
import AppContext from '../src/context/CreateGlobalStateContext';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => {
    if (key === '@amara_user_city') return Promise.resolve('Udayapura');
    if (key === '@amara_user_country') return Promise.resolve('India');
    return Promise.resolve(null);
  }),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('react-native-vector-icons/Feather', () => 'Feather');

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

jest.mock('../src/utils/geolocation', () => ({
  getCurrentLocation: jest.fn(() => Promise.resolve({ latitude: 12.7937, longitude: 77.5085 })),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

describe('ResetLocationScreen', () => {
  it('renders Your location card with City, Country, explanation, and Reset Location button', async () => {
    const mockContext = {
      location: 'Udayapura, India',
      setLocation: jest.fn(),
    };

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <QueryClientProvider client={queryClient}>
          <AppContext.Provider value={mockContext as any}>
            <ResetLocationScreen />
          </AppContext.Provider>
        </QueryClientProvider>
      );
    });

    const json = JSON.stringify(renderer!.toJSON());
    expect(json).toContain('Reset Location');
    expect(json).toContain('Your location');
    expect(json).toContain('City');
    expect(json).toContain('Country');
    expect(json).toContain('Udayapura');
    expect(json).toContain('India');
    expect(json).toContain('Reset your location?');
    expect(json).toContain("Only do this if you've traveled somewhere new and your location hasn't updated.");
  });
});
