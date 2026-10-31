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

import LoginScreen from '../src/screens/Auth/LoginScreen';
import ForgotPasswordScreen from '../src/screens/Auth/ForgotPasswordScreen';
import GenderOrientationScreen from '../src/screens/onboarding/GenderOrientationScreen';
import DisplayNameScreen from '../src/screens/onboarding/DisplayNameScreen';
import AppContext from '../src/context/CreateGlobalStateContext';

const mockContextValue: any = {
  name: 'Sailakshmi',
  setName: jest.fn(),
  displayName: 'Sailakshmi',
  setDisplayName: jest.fn(),
  phoneNumber: '9876543210',
  setPhoneNumber: jest.fn(),
  password: 'Password@123',
  setPassword: jest.fn(),
  gender: null,
  setGender: jest.fn(),
  setSelected: jest.fn(),
  setDate: jest.fn(),
  setAuthUserId: jest.fn(),
  themeColors: null,
  isDark: false,
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (ui: React.ReactElement) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContext.Provider value={mockContextValue}>
        {ui}
      </AppContext.Provider>
    </QueryClientProvider>
  );
};

describe('Auth & Onboarding Redesigned Screens', () => {
  test('LoginScreen renders correctly', () => {
    let tree: any;
    ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(renderWithProviders(<LoginScreen navigation={mockNavigation} />));
    });
    expect(tree).toBeDefined();
    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Amara');
    expect(str).toContain('Log in to your account');
    expect(str).toContain('Forgot Password?');
  });

  test('ForgotPasswordScreen renders correctly', () => {
    let tree: any;
    ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(renderWithProviders(<ForgotPasswordScreen navigation={mockNavigation} />));
    });
    expect(tree).toBeDefined();
    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Amara');
    expect(str).toContain('Reset Password');
  });

  test('GenderOrientationScreen renders correctly', () => {
    let tree: any;
    ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(renderWithProviders(<GenderOrientationScreen navigation={mockNavigation} />));
    });
    expect(tree).toBeDefined();
    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Hey there!');
    expect(str).toContain("What's your gender?");
    expect(str).toContain('Man');
    expect(str).toContain('Woman');
    expect(str).toContain('LGBTQ+');
  });

  test('DisplayNameScreen renders correctly with name & birthday boxes', () => {
    let tree: any;
    ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(renderWithProviders(<DisplayNameScreen navigation={mockNavigation} />));
    });
    expect(tree).toBeDefined();
    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain("What's your name?");
    expect(str).toContain('Your birthday?');
    expect(str).toContain('DD');
    expect(str).toContain('MM');
    expect(str).toContain('YYYY');
  });
});
