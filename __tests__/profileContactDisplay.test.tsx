import { extractPhone, extractTelegram, isInvalidPhoneNumber, isInvalidTelegramHandle } from '../src/utils/whatsappHelper';

describe('Profile Contact Display & Parsing', () => {
  it('validates test phone numbers correctly and does not drop them', () => {
    expect(isInvalidPhoneNumber('1234567890')).toBe(false);
    expect(isInvalidPhoneNumber('9876543210')).toBe(false);
    expect(isInvalidPhoneNumber('+91 9876543210')).toBe(false);
    expect(isInvalidPhoneNumber('+44 7911 123456')).toBe(false);
    expect(isInvalidPhoneNumber('0000000000')).toBe(true);
    expect(isInvalidPhoneNumber('NONE')).toBe(true);
    expect(isInvalidPhoneNumber('')).toBe(true);
  });

  it('validates telegram handles correctly', () => {
    expect(isInvalidTelegramHandle('ananya_amara')).toBe(false);
    expect(isInvalidTelegramHandle('@ananya_amara')).toBe(false);
    expect(isInvalidTelegramHandle('NONE')).toBe(true);
    expect(isInvalidTelegramHandle('')).toBe(true);
    expect(isInvalidTelegramHandle('has space')).toBe(true);
  });

  it('extracts both phone and telegram when provided in profile data', () => {
    const profile = {
      displayName: 'Priya Sharma',
      phoneNumber: '9876543210',
      telegramUsername: 'priya_amara',
    };

    const phone = extractPhone(profile);
    const tg = extractTelegram(profile);

    expect(phone).toBe('9876543210');
    expect(tg).toBe('priya_amara');
  });

  it('extracts phone from alternative field names (mobile, phone, mobileNumber)', () => {
    expect(extractPhone({ mobile: '+91 9812345678' })).toBe('+91 9812345678');
    expect(extractPhone({ phone: '9812345678' })).toBe('9812345678');
    expect(extractPhone({ mobileNumber: '9812345678' })).toBe('9812345678');
  });
});
