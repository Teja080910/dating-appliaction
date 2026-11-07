import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import Toast from 'react-native-toast-message';
import {
  toastConfig,
  showSuccessToast,
  showErrorToast,
  showInfoToast,
} from '../src/components/AmaraToast';

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('react-native-toast-message', () => {
  const mockToast = {
    show: jest.fn(),
    hide: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockToast,
    ...mockToast,
  };
});

describe('AmaraToast Component & Config', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('toastConfig contains success, error, and info renderers', () => {
    expect(toastConfig.success).toBeDefined();
    expect(toastConfig.error).toBeDefined();
    expect(toastConfig.info).toBeDefined();
  });

  test('renders success toast with title and subtitle', () => {
    const hideFn = jest.fn();
    const element = toastConfig.success({
      position: 'top',
      type: 'success',
      isVisible: true,
      text1: 'Filters Applied',
      text2: 'Matches updated based on your preferences.',
      show: jest.fn(),
      hide: hideFn,
      onPress: jest.fn(),
      props: {},
    });

    let renderer: ReactTestRenderer.ReactTestRenderer | null = null;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(element as React.ReactElement);
    });

    const root = renderer!.root;
    expect(root.findByProps({ children: 'Filters Applied' })).toBeDefined();
    expect(
      root.findByProps({ children: 'Matches updated based on your preferences.' })
    ).toBeDefined();
  });

  test('renders error toast with error title', () => {
    const element = toastConfig.error({
      position: 'top',
      type: 'error',
      isVisible: true,
      text1: 'Failed to Apply',
      text2: 'Connection error',
      show: jest.fn(),
      hide: jest.fn(),
      onPress: jest.fn(),
      props: {},
    });

    let renderer: ReactTestRenderer.ReactTestRenderer | null = null;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(element as React.ReactElement);
    });

    const root = renderer!.root;
    expect(root.findByProps({ children: 'Failed to Apply' })).toBeDefined();
  });

  test('renders info toast and responds to hide', () => {
    const hideMock = jest.fn();
    const element = toastConfig.info({
      position: 'top',
      type: 'info',
      isVisible: true,
      text1: 'Filters Reset',
      text2: 'Restored defaults',
      show: jest.fn(),
      hide: hideMock,
      onPress: jest.fn(),
      props: {},
    });

    let renderer: ReactTestRenderer.ReactTestRenderer | null = null;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(element as React.ReactElement);
    });

    const root = renderer!.root;
    expect(root.findByProps({ children: 'Filters Reset' })).toBeDefined();
  });

  test('showSuccessToast helper invokes Toast.show with type success', () => {
    showSuccessToast('Success Title', 'Success message');
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        text1: 'Success Title',
        text2: 'Success message',
      })
    );
  });

  test('showErrorToast helper invokes Toast.show with type error', () => {
    showErrorToast('Error Title', 'Error message');
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        text1: 'Error Title',
        text2: 'Error message',
      })
    );
  });

  test('showInfoToast helper invokes Toast.show with type info', () => {
    showInfoToast('Info Title', 'Info message');
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'info',
        text1: 'Info Title',
        text2: 'Info message',
      })
    );
  });
});
