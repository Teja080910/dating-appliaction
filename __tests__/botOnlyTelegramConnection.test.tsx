import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ContactDetails from '../src/components/ProfileTabComponents/ProfileSettings/ContactDetails';
import ConnectTelegramScreen from '../src/screens/onboarding/ConnectTelegramScreen';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('react-native-vector-icons/Feather', () => 'Feather');

jest.mock('../src/utils/telegramHelper', () => ({
  openAmaraBot: jest.fn(() => Promise.resolve(true)),
  getAmaraBotUsername: jest.fn(() => 'amara_dating_bot'),
}));

jest.mock('../src/api/useTelegram', () => {
  const actual = jest.requireActual('../src/api/useTelegram');
  return {
    ...actual,
    useTelegram: () => ({
      disconnectTelegram: { mutateAsync: jest.fn().mockResolvedValue({}) },
    }),
    useTelegramBotName: () => ({ data: 'amara_dating_bot' }),
    useMyTelegramStatus: () => ({ data: { telegramUsername: '', isConnected: false }, refetch: jest.fn() }),
    fetchAmaraBotLink: jest.fn().mockResolvedValue('https://t.me/amara_dating_bot?start=token123'),
    fetchAmaraBotName: jest.fn().mockResolvedValue('amara_dating_bot'),
  };
});

jest.mock('../src/api/useProfile', () => ({
  useProfile: () => ({
    useMyProfile: () => ({ data: { telegramUsername: '' }, refetch: jest.fn() }),
    useSendWhatsappOtp: { mutate: jest.fn(), mutateAsync: jest.fn().mockResolvedValue({}) },
    useVerifyWhatsappOtp: { mutate: jest.fn(), mutateAsync: jest.fn().mockResolvedValue({}) },
  }),
  useSendWhatsappOtp: () => ({ mutate: jest.fn(), mutateAsync: jest.fn().mockResolvedValue({}) }),
  useVerifyWhatsappOtp: () => ({ mutate: jest.fn(), mutateAsync: jest.fn().mockResolvedValue({}) }),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

describe('Bot-Only Telegram Connection (No Username Input)', () => {
  it('ContactDetails does NOT render any Telegram username TextInput or Save button modal', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      renderer = ReactTestRenderer.create(
        <QueryClientProvider client={queryClient}>
          <ContactDetails
            telegramUsername=""
            setTelegramUsername={jest.fn()}
          />
        </QueryClientProvider>
      );
    });

    const root = renderer!.root;
    // Check that there is no TextInput with placeholder="username"
    const textInputs = root.findAll((node: any) => node.type === 'TextInput');
    const usernameInputs = textInputs.filter(
      (input) => input.props.placeholder === 'username'
    );
    expect(usernameInputs.length).toBe(0);

    const json = JSON.stringify(renderer!.toJSON());
    expect(json).not.toContain('Enter your Telegram username');
    expect(json).toContain('Connect Telegram');
    expect(json).toContain('Not connected');
  });

  it('ConnectTelegramScreen does NOT render any Telegram username TextInput or Save button modal', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      renderer = ReactTestRenderer.create(
        <QueryClientProvider client={queryClient}>
          <ConnectTelegramScreen
            navigation={{ navigate: jest.fn(), replace: jest.fn(), canGoBack: jest.fn() }}
            route={{ name: 'ConnectTelegram', params: {} }}
          />
        </QueryClientProvider>
      );
    });

    const root = renderer!.root;
    const textInputs = root.findAll((node: any) => node.type === 'TextInput');
    const usernameInputs = textInputs.filter(
      (input) => input.props.placeholder === 'username'
    );
    expect(usernameInputs.length).toBe(0);

    const json = JSON.stringify(renderer!.toJSON());
    expect(json).not.toContain('Enter your Telegram username');
    expect(json).not.toContain('Check Connection Status');
    expect(json).not.toContain('Tap Connect Telegram to launch');
    expect(json).toContain('Connect Telegram');
    expect(json).toContain('Not connected');
  });

  it('renders Disconnect Telegram button and Connected to: @sai_049 when user is connected', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      renderer = ReactTestRenderer.create(
        <QueryClientProvider client={queryClient}>
          <ContactDetails
            telegramUsername="sai_049"
            setTelegramUsername={jest.fn()}
          />
        </QueryClientProvider>
      );
    });

    const json = JSON.stringify(renderer!.toJSON());
    expect(json).toContain('Disconnect Telegram');
    expect(json).toContain('Connected to: @sai_049');
    expect(json).not.toContain('Enter your Telegram username');
  });

  it('directly disconnects without showing any confirmation popup dialog when Disconnect Telegram is pressed', async () => {
    const mockSetTelegramUsername = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <QueryClientProvider client={queryClient}>
          <ContactDetails
            telegramUsername="sai_049"
            setTelegramUsername={mockSetTelegramUsername}
          />
        </QueryClientProvider>
      );
    });

    const root = renderer!.root;
    const touchables = root.findAll((node: any) => typeof node.props?.onPress === 'function');
    const disconnectBtn = touchables.find((node: any) => {
      const texts = node.findAllByType('Text');
      return texts.some((t: any) => t.props.children === 'Disconnect Telegram');
    });

    expect(disconnectBtn).toBeDefined();

    // Trigger press
    await act(async () => {
      disconnectBtn!.props.onPress();
    });

    expect(mockSetTelegramUsername).toHaveBeenCalledWith('');
  });
});
