import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockNavigation = {
  navigate: jest.fn(),
  replace: jest.fn(),
  goBack: jest.fn(),
  canGoBack: jest.fn(() => true),
};

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
  useIsFocused: () => true,
  useNavigation: () => mockNavigation,
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => null),
  multiSet: jest.fn(async () => null),
  multiRemove: jest.fn(async () => null),
  removeItem: jest.fn(async () => null),
}));
jest.mock('../src/components/LanguageSelectorHeader', () => 'LanguageSelectorHeader');
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));
jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('react-native-vector-icons/Feather', () => 'Feather');
jest.mock('react-native-vision-camera', () => ({
  Camera: 'Camera',
  useCameraDevice: () => ({ id: 'front' }),
  useCameraDevices: () => [{ id: '1', position: 'front' }],
  useCameraPermission: () => ({
    hasPermission: false,
    requestPermission: jest.fn(async () => true),
  }),
}));

import AppContext from '../src/context/CreateGlobalStateContext';
import LoginScreen from '../src/screens/Auth/LoginScreen';
import ForgotPasswordScreen from '../src/screens/Auth/ForgotPasswordScreen';
import RegisterScreen from '../src/screens/Auth/RegisterScreen';
import OTPScreen from '../src/screens/Auth/OTPScreen';
import SelfieVerificationScreen from '../src/screens/onboarding/SelfieVerificationScreen';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const mockContextValue: any = {
  name: 'Test User',
  displayName: 'Test',
  gender: 'straight_man',
  date: '1995-05-15',
  setName: jest.fn(),
  setDisplayName: jest.fn(),
  setGender: jest.fn(),
  setPassword: jest.fn(),
  setPhoneNumber: jest.fn(),
  setAuthUserId: jest.fn(),
  setVerifiedSelfie: jest.fn(),
  themeColors: null,
  isDark: true,
};

const renderWithProviders = (ui: React.ReactElement) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContext.Provider value={mockContextValue}>
        {ui}
      </AppContext.Provider>
    </QueryClientProvider>
  );
};

describe('Glambu-style Auth and Verification Screens with Amara Theme', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('LoginScreen renders Glambu-style rounded cards and pill buttons', () => {
    let tree: any;
    ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(renderWithProviders(<LoginScreen navigation={mockNavigation} />));
    });
    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Log in to your account');
    expect(str).toContain('EMAIL');
    expect(str).toContain('PASSWORD');
    expect(str).toContain('Forgot Password?');
    expect(str).toContain('Login');
    expect(str).toContain("I don't have an account");
    expect(str).toContain('Terms');
    expect(str).toContain('Privacy Policy');
    ReactTestRenderer.act(() => {
      tree.unmount();
    });
  });

  test('ForgotPasswordScreen renders Glambu-style layout and buttons', () => {
    let tree: any;
    ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(renderWithProviders(<ForgotPasswordScreen navigation={mockNavigation} />));
    });
    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Reset Password');
    expect(str).toContain('EMAIL');
    expect(str).toContain('Send reset code');
    expect(str).toContain('Back to login');
    ReactTestRenderer.act(() => {
      tree.unmount();
    });
  });

  test('RegisterScreen renders Glambu-style form cards and buttons', () => {
    let tree: any;
    ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(renderWithProviders(<RegisterScreen navigation={mockNavigation} />));
    });
    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Create your account');
    expect(str).toContain('NAME');
    expect(str).toContain('EMAIL');
    expect(str).toContain('PASSWORD');
    expect(str).toContain('CONFIRM PASSWORD');
    expect(str).toContain('Create account');
    expect(str).toContain('Already have an account? Log in');
    ReactTestRenderer.act(() => {
      tree.unmount();
    });
  });

  test('OTPScreen renders unified gradient and Glambu pill buttons', () => {
    let tree: any;
    ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(
        renderWithProviders(
          <OTPScreen
            navigation={mockNavigation}
            route={{ params: { email: 'test@example.com' } }}
          />
        )
      );
    });
    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Verify');
    expect(str).toContain('test@example.com');
    ReactTestRenderer.act(() => {
      tree.unmount();
    });
  });

  test('SelfieVerificationScreen renders camera viewfinder screen', () => {
    let tree: any;
    ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(
        renderWithProviders(<SelfieVerificationScreen navigation={mockNavigation} />)
      );
    });
    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Center your face');
    expect(str).toContain('Allow Camera');
    ReactTestRenderer.act(() => {
      tree.unmount();
    });
  });
});
