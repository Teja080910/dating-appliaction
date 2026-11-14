import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mockStore } from '../src/mock/mockStore';
import apiClient from '../src/api/apiClient';
import ContactDetails from '../src/components/ProfileTabComponents/ProfileSettings/ContactDetails';
import PhoneOtpModal from '../src/components/ProfileTabComponents/ProfileSettings/PhoneOtpModal';
import { parsePhoneNumberAndCountry } from '../src/components/ProfileTabComponents/ProfileSettings/ContactDetails';

jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('react-native-vector-icons/Feather', () => 'Feather');

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

describe('Phone Number OTP Verification in Edit Profile', () => {
  beforeEach(async () => {
    await mockStore.init();
  });

  describe('Backend Endpoint Tests', () => {
    it('sends OTP to WhatsApp number via /profile/whatsapp/send-otp', async () => {
      const response = await apiClient.post('/profile/whatsapp/send-otp', {
        mobile: '+91 9876543210',
      });

      expect(response.status).toBe(200);
      expect(response.data.status).toBe('success');
      expect(response.data.sessionId).toBeDefined();
      expect(response.data.otp).toBeDefined();
    });

    it('rejects send-otp when mobile number is missing', async () => {
      await expect(
        apiClient.post('/profile/whatsapp/send-otp', { mobile: '' })
      ).rejects.toThrow();
    });

    it('verifies valid OTP via /profile/whatsapp/verify', async () => {
      const sendRes = await apiClient.post('/profile/whatsapp/send-otp', {
        mobile: '+91 9876543210',
      });
      const sessionId = sendRes.data.sessionId;
      const otp = sendRes.data.otp;

      const verifyRes = await apiClient.post('/profile/whatsapp/verify', {
        mobile: '+91 9876543210',
        otp: otp || '123456',
        sessionId,
      });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.data.status).toBe('success');
    });

    it('rejects invalid OTP via /profile/whatsapp/verify', async () => {
      const sendRes = await apiClient.post('/profile/whatsapp/send-otp', {
        mobile: '+91 9876543210',
      });
      const sessionId = sendRes.data.sessionId;

      await expect(
        apiClient.post('/profile/whatsapp/verify', {
          mobile: '+91 9876543210',
          otp: '999999',
          sessionId,
        })
      ).rejects.toThrow();
    });
  });

  describe('Phone Comparison and OTP Trigger Logic', () => {
    const normalizeForCompare = (phoneStr?: string | null) => {
      if (!phoneStr) return '';
      const parsed = parsePhoneNumberAndCountry(phoneStr);
      const code = (parsed?.code || '').replace(/\D/g, '');
      let num = (parsed?.number || phoneStr).replace(/\D/g, '');
      if (code && num.startsWith(code) && num.length >= code.length + 7) {
        num = num.slice(code.length);
      }
      return `${code}${num}`;
    };

    it('detects when phone number has genuinely changed', () => {
      const existingPhone = '+91 9876543210';
      const newPhone = '+91 9123456789';

      const isChanged =
        Boolean(newPhone) &&
        normalizeForCompare(newPhone) !== normalizeForCompare(existingPhone);

      expect(isChanged).toBe(true);
    });

    it('treats identical phone numbers with different formatting as unchanged', () => {
      const existingPhone = '+91 9876543210';
      const newPhone = '+919876543210';

      const isChanged =
        Boolean(newPhone) &&
        normalizeForCompare(newPhone) !== normalizeForCompare(existingPhone);

      expect(isChanged).toBe(false);
    });

    it('does NOT trigger OTP when phone number is left empty or removed', () => {
      const existingPhone = '+91 9876543210';
      const newPhone = '';

      const isChanged =
        Boolean(newPhone) &&
        normalizeForCompare(newPhone) !== normalizeForCompare(existingPhone);

      expect(isChanged).toBe(false);
    });
  });

  describe('PhoneOtpModal Component UI', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      act(() => {
        jest.runOnlyPendingTimers();
      });
      jest.useRealTimers();
    });

    it('renders modal with target phone number and 6 digit code boxes', () => {
      const onVerify = jest.fn();
      const onResend = jest.fn();
      const onClose = jest.fn();

      let renderer: ReactTestRenderer.ReactTestRenderer;
      act(() => {
        renderer = ReactTestRenderer.create(
          <PhoneOtpModal
            visible={true}
            phoneNumber="+91 9876543210"
            onVerify={onVerify}
            onResend={onResend}
            onClose={onClose}
          />
        );
      });

      const root = renderer!.root;
      const allText = root.findAllByType(Text).map((node: any) =>
        typeof node.props.children === 'string' ? node.props.children : ''
      );

      const hasTitle = allText.some((txt: string) => txt.includes('WhatsApp'));
      const hasPhone = allText.some((txt: string) => txt.includes('+91 9876543210'));
      expect(hasTitle).toBe(true);
      expect(hasPhone).toBe(true);

      act(() => {
        renderer.unmount();
      });
    });

    it('displays error message when provided', () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      act(() => {
        renderer = ReactTestRenderer.create(
          <PhoneOtpModal
            visible={true}
            phoneNumber="+91 9876543210"
            onVerify={jest.fn()}
            onResend={jest.fn()}
            onClose={jest.fn()}
            errorMessage="Invalid or expired verification code."
          />
        );
      });

      const root = renderer!.root;
      const allText = root.findAllByType(Text).map((node: any) =>
        typeof node.props.children === 'string' ? node.props.children : ''
      );

      const hasError = allText.some((txt: string) => txt.includes('Invalid or expired'));
      expect(hasError).toBe(true);

      act(() => {
        renderer.unmount();
      });
    });
  });

  describe('ContactDetails Inline Verification UI', () => {
    it('renders inline Verify button when phone number is entered and not verified', () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      act(() => {
        renderer = ReactTestRenderer.create(
          <QueryClientProvider client={queryClient}>
            <ContactDetails
              showWhatsApp={true}
              countryCode="+91"
              phoneNumber="9876543210"
              telegramUsername=""
              setTelegramUsername={jest.fn()}
              isVerified={false}
              setIsVerified={jest.fn()}
            />
          </QueryClientProvider>
        );
      });

      const json = JSON.stringify(renderer!.toJSON());
      expect(json).toContain('Verify');
      expect(json).not.toContain('Verified');
    });

    it('renders inline Verified badge when phone number is verified', () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      act(() => {
        renderer = ReactTestRenderer.create(
          <QueryClientProvider client={queryClient}>
            <ContactDetails
              showWhatsApp={true}
              countryCode="+91"
              phoneNumber="9876543210"
              telegramUsername=""
              setTelegramUsername={jest.fn()}
              isVerified={true}
              setIsVerified={jest.fn()}
            />
          </QueryClientProvider>
        );
      });

      const json = JSON.stringify(renderer!.toJSON());
      expect(json).toContain('Verified');
    });

    it('displays Already have an OTP link and clicking it displays OTP input and Validate button', () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      act(() => {
        renderer = ReactTestRenderer.create(
          <QueryClientProvider client={queryClient}>
            <ContactDetails
              showWhatsApp={true}
              countryCode="+91"
              phoneNumber="9876543210"
              telegramUsername=""
              setTelegramUsername={jest.fn()}
              isVerified={false}
              setIsVerified={jest.fn()}
            />
          </QueryClientProvider>
        );
      });

      // Check helper link exists
      const jsonBefore = JSON.stringify(renderer!.toJSON());
      expect(jsonBefore).toContain('Already have an OTP? Enter code');

      // Find the pressable with text containing 'Already have an OTP'
      const allPressables = renderer!.root.findAll((node: any) => typeof node.props?.onPress === 'function');
      const helperTouchable = allPressables.find((t: any) => {
        const textNodes = t.findAllByType ? t.findAllByType(Text) : [];
        return textNodes.some((tn: any) =>
          typeof tn.props.children === 'string' && tn.props.children.includes('Already have an OTP')
        );
      });

      expect(helperTouchable).toBeTruthy();

      act(() => {
        helperTouchable?.props.onPress();
      });

      const jsonAfter = JSON.stringify(renderer!.toJSON());
      expect(jsonAfter).toContain('Enter 6-digit OTP');
      expect(jsonAfter).toContain('Validate');
    });

    it('pressing Verify immediately reveals OTP input field and Validate button', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      act(() => {
        renderer = ReactTestRenderer.create(
          <QueryClientProvider client={queryClient}>
            <ContactDetails
              showWhatsApp={true}
              countryCode="+91"
              phoneNumber="9876543210"
              telegramUsername=""
              setTelegramUsername={jest.fn()}
              isVerified={false}
              setIsVerified={jest.fn()}
            />
          </QueryClientProvider>
        );
      });

      const allPressables = renderer!.root.findAll((node: any) => typeof node.props?.onPress === 'function');
      const verifyButton = allPressables.find((t: any) => {
        const textNodes = t.findAllByType ? t.findAllByType(Text) : [];
        return textNodes.some((tn: any) =>
          typeof tn.props.children === 'string' && tn.props.children === 'Verify'
        );
      });

      expect(verifyButton).toBeTruthy();

      await act(async () => {
        await verifyButton?.props.onPress();
      });

      const jsonAfter = JSON.stringify(renderer!.toJSON());
      expect(jsonAfter).toContain('Enter 6-digit OTP');
      expect(jsonAfter).toContain('Validate');
    });
  });
});
