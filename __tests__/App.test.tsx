/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('../src/components/SubscriptionModal', () => 'SubscriptionModal');
jest.mock('../src/screens/Navigations/Routes', () => 'Routes');
jest.mock('react-native-toast-message', () => 'Toast');
jest.mock('../src/api/useMisc', () => ({
  useServices: () => ({
    setOnline: { mutate: jest.fn() },
    setOffline: { mutate: jest.fn() },
  }),
}));
jest.mock('../src/api/useSubscription', () => ({
  useSubscription: () => ({
    subscriptionStatus: null,
    statusError: null,
  }),
}));
jest.mock('../src/utils/sessionHelper', () => ({
  getUserId: jest.fn(() => Promise.resolve(null)),
}));
jest.mock('../src/context/GlobalStateProvider', () => {
  const React = require('react');
  const AppContext = require('../src/context/CreateGlobalStateContext').default;

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      AppContext.Provider,
      {
        value: {
          paywallVisible: false,
          setPaywallVisible: jest.fn(),
        },
      },
      children,
    );
});

test('renders correctly', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | null = null;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });
  expect(renderer).toBeDefined();
  await ReactTestRenderer.act(async () => {
    renderer?.unmount();
  });
});
