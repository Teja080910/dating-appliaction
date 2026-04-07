/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('../src/components/SubscriptionModal', () => 'SubscriptionModal');
jest.mock('../src/screens/Navigations/Routes', () => 'Routes');
jest.mock('react-native-toast-message', () => 'Toast');
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
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
