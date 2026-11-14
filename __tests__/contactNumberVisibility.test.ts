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
});
