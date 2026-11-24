import { extractPhone } from '../src/utils/whatsappHelper';

describe('Contact Number Visibility and Fallback Tests', () => {
  it('extractPhone falls back to contextPhone or storedPhone when profile object has empty phone fields', () => {
    const profileWithEmptyPhone = {
      id: 1222,
      name: 'Abhishek',
      mobile: '',
      phoneNumber: '',
      phone: '',
      mobileNumber: '',
    };

    const contextPhone = '+919876543210';
    const storedPhone = '+919876543210';

    const result = extractPhone(
      profileWithEmptyPhone,
      contextPhone,
      storedPhone
    );

    expect(result).toBe('+919876543210');
  });

  it('extractPhone prefers valid server phone over context/stored phone', () => {
    const profileWithPhone = {
      id: 1222,
      name: 'Abhishek',
      mobile: '+919999999999',
    };

    const contextPhone = '+919876543210';
    const storedPhone = '+918888888888';

    const result = extractPhone(
      profileWithPhone,
      contextPhone,
      storedPhone
    );

    expect(result).toBe('+919999999999');
  });

  it('extractPhone falls back to storedPhone when contextPhone is empty and profile is empty', () => {
    const profileEmpty = {
      mobile: '',
    };

    const result = extractPhone(
      profileEmpty,
      '',
      '+918888888888'
    );

    expect(result).toBe('+918888888888');
  });

  it('verifies ViewMyProfileScreen selfPhone logic resolves phone when fetched profile has empty strings', () => {
    const normalizeTextValue = (val: unknown): string => {
      if (val === undefined || val === null) return '';
      const s = String(val).trim();
      return s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined' ? '' : s;
    };

    const fetched: any = {
      id: 1222,
      name: 'Abhishek',
      phoneNumber: '',
      mobile: '',
      phone: '',
      mobileNumber: '',
    };
    const contextPhone = '+919876543210';
    const storedPhone = '';

    const selfPhone =
      normalizeTextValue(fetched?.phoneNumber) ||
      normalizeTextValue(fetched?.mobile) ||
      normalizeTextValue(fetched?.phone) ||
      normalizeTextValue(fetched?.mobileNumber) ||
      normalizeTextValue(contextPhone) ||
      normalizeTextValue(storedPhone) ||
      '';

    expect(selfPhone).toBe('+919876543210');
  });

  describe('Female Contact Privacy (Glambu / Amara Rule)', () => {
    const normalizeTextValue = (val: unknown): string => {
      if (val === undefined || val === null) return '';
      const s = String(val).trim();
      return s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined' ? '' : s;
    };

    it('masks female contact details when a male user views her profile before invitation acceptance', () => {
      const isViewingSelf = false;
      const isViewerWoman = false;
      const isAcceptedMatch = false; // Not accepted yet!

      const routed = {
        id: 999,
        name: 'Priya',
        gender: 'female',
        telegramUsername: 'priya_amara',
        phoneNumber: '+919876543210',
        mobile: '+919876543210',
      };

      const resolvedTelegram = isViewingSelf
        ? normalizeTextValue(routed?.telegramUsername)
        : (isViewerWoman || !isAcceptedMatch ? '' : normalizeTextValue(routed?.telegramUsername));

      const resolvedPhone = isViewingSelf
        ? normalizeTextValue(routed?.phoneNumber)
        : (isViewerWoman || !isAcceptedMatch ? '' : (normalizeTextValue(routed?.phoneNumber) || normalizeTextValue(routed?.mobile)));

      expect(resolvedTelegram).toBe('');
      expect(resolvedPhone).toBe('');
    });

    it('unmasks female contact details when an invitation is accepted and viewer is male', () => {
      const isViewingSelf = false;
      const isViewerWoman = false;
      const isAcceptedMatch = true; // Accepted!

      const routed = {
        id: 999,
        name: 'Priya',
        gender: 'female',
        telegramUsername: 'priya_amara',
        phoneNumber: '+919876543210',
        mobile: '+919876543210',
      };

      const resolvedTelegram = isViewingSelf
        ? normalizeTextValue(routed?.telegramUsername)
        : (isViewerWoman || !isAcceptedMatch ? '' : normalizeTextValue(routed?.telegramUsername));

      const resolvedPhone = isViewingSelf
        ? normalizeTextValue(routed?.phoneNumber)
        : (isViewerWoman || !isAcceptedMatch ? '' : (normalizeTextValue(routed?.phoneNumber) || normalizeTextValue(routed?.mobile)));

      expect(resolvedTelegram).toBe('priya_amara');
      expect(resolvedPhone).toBe('+919876543210');
    });

    it('never reveals male contact details to a female viewer even if match is accepted', () => {
      const isViewingSelf = false;
      const isViewerWoman = true; // Viewer is woman!
      const isAcceptedMatch = true;

      const routed = {
        id: 111,
        name: 'Rahul',
        gender: 'male',
        telegramUsername: 'rahul_amara',
        phoneNumber: '+919876543210',
      };

      const resolvedTelegram = isViewingSelf
        ? normalizeTextValue(routed?.telegramUsername)
        : (isViewerWoman || !isAcceptedMatch ? '' : normalizeTextValue(routed?.telegramUsername));

      const resolvedPhone = isViewingSelf
        ? normalizeTextValue(routed?.phoneNumber)
        : (isViewerWoman || !isAcceptedMatch ? '' : normalizeTextValue(routed?.phoneNumber));

      expect(resolvedTelegram).toBe('');
      expect(resolvedPhone).toBe('');
    });
  });
});
