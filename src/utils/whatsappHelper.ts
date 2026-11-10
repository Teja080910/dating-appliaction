import { Alert, Linking, Share } from 'react-native';

export const isInvalidPhoneNumber = (val?: unknown): boolean => {
  if (!val) return true;
  const str = String(val).trim();
  if (!str || str.includes('@') || /[a-zA-Z]/.test(str)) return true;
  const upper = str.toUpperCase();
  if (
    upper === '-' ||
    upper === 'NONE' ||
    upper === 'NULL' ||
    upper === 'UNDEFINED' ||
    upper === 'N/A'
  ) {
    return true;
  }
  const digits = str.replace(/\D/g, '');
  if (digits.length < 5) return true;
  // All identical zeroes (e.g., 0000000000)
  if (/^0+$/.test(digits)) return true;
  return false;
};

/**
 * Extract phone number from multiple candidate sources (objects, strings, nested profiles).
 */
export const extractPhone = (...sources: any[]): string => {
  for (const src of sources) {
    if (!src) continue;
    if (typeof src === 'string') {
      const trimmed = src.trim();
      if (!isInvalidPhoneNumber(trimmed)) {
        return trimmed;
      }
      continue;
    }
    if (typeof src === 'object') {
      const cand =
        src.phoneNumber ||
        src.mobile ||
        src.phone ||
        src.mobileNumber ||
        src.whatsapp ||
        src.whatsappNumber ||
        src.contact ||
        src.contactNumber ||
        src.user?.phoneNumber ||
        src.user?.mobile ||
        src.user?.phone ||
        src.user?.whatsapp ||
        src.profile?.phoneNumber ||
        src.profile?.mobile ||
        src.profile?.phone ||
        src.profile?.whatsapp;
      if (cand && !isInvalidPhoneNumber(cand)) {
        return String(cand).trim();
      }
    }
  }
  return '';
};

export const isInvalidTelegramHandle = (val?: unknown): boolean => {
  if (!val) return true;
  const str = String(val).trim().replace(/^@+/, '');
  const norm = str.toUpperCase();
  return (
    !norm ||
    norm.includes(' ') ||
    norm === '-' ||
    norm === 'NONE' ||
    norm === 'NULL' ||
    norm === 'UNDEFINED' ||
    norm === 'N/A'
  );
};

/**
 * Extract telegram username from multiple candidate sources.
 */
export const extractTelegram = (...sources: any[]): string => {
  for (const src of sources) {
    if (!src) continue;
    if (typeof src === 'string') {
      const trimmed = src.trim().replace(/^@+/, '');
      if (trimmed && !isInvalidTelegramHandle(trimmed)) return trimmed;
    }
    if (typeof src === 'object') {
      const cand =
        src.telegramUsername ||
        src.telegram ||
        src.tgUsername ||
        src.tg ||
        src.telegramHandle ||
        src.user?.telegramUsername ||
        src.user?.telegram ||
        src.profile?.telegramUsername ||
        src.profile?.telegram;
      if (cand && typeof cand === 'string') {
        const trimmed = cand.trim().replace(/^@+/, '');
        if (trimmed && !isInvalidTelegramHandle(trimmed)) return trimmed;
      }
    }
  }
  return '';
};

/**
 * Normalizes a phone string to international digits without '+' (e.g. 919014701586).
 * Automatically cleans up repeated country code prefixes (e.g. 9191... or +91 91...).
 */
export const normalizePhoneDigits = (phone?: string | null): string => {
  if (!phone) return '';
  const trimmed = String(phone).trim();
  let digits = trimmed.replace(/[^\d]/g, '');
  if (!digits) return '';

  // 1. Detect and strip repeated country code for India (9191... or multiple 91s)
  // An Indian mobile number is 10 digits starting with 6, 7, 8, or 9
  const indianRepeatMatch = digits.match(/^(?:91)+([6-9]\d{9})$/);
  if (indianRepeatMatch) {
    return `91${indianRepeatMatch[1]}`;
  }

  // 2. Standard 10-digit Indian mobile number without country code
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `91${digits}`;
  }

  // 3. Indian number with leading 0 (e.g. 09014701586)
  if (digits.length === 11 && digits.startsWith('0') && /^[6-9]/.test(digits.slice(1))) {
    return `91${digits.slice(1)}`;
  }

  // 4. General check for duplicated country codes across all countries (e.g. 4444... for UK, 11... for US)
  const countryCodes = ['852', '886', '971', '966', '373', '375', '351', '91', '44', '61', '34', '52', '57', '54', '55', '49', '43', '41', '40', '33', '32', '86', '81', '62', '60', '39', '7', '1'];
  for (const cc of countryCodes) {
    const doubleCc = `${cc}${cc}`;
    if (digits.startsWith(doubleCc) && digits.length >= doubleCc.length + 5) {
      let clean = digits;
      while (clean.startsWith(doubleCc) && clean.length >= doubleCc.length + 5) {
        clean = clean.slice(cc.length);
      }
      return clean;
    }
  }

  return digits;
};

/**
 * Formats a phone number for user-friendly display (e.g. +91 90147 01586).
 * Safely strips any accidental duplicate country code prefixes.
 */
export const formatDisplayPhone = (phone?: string | null): string => {
  if (!phone) return '';
  const cleanDigits = normalizePhoneDigits(phone);
  if (!cleanDigits) return phone ? String(phone).trim() : '';

  // For Indian numbers: 91 followed by 10 digits
  const indianMatch = cleanDigits.match(/^91([6-9]\d{9})$/);
  if (indianMatch) {
    const num = indianMatch[1];
    return `+91 ${num.slice(0, 5)} ${num.slice(5)}`;
  }

  // General format: +<digits>
  return `+${cleanDigits}`;
};

/**
 * Robust helper to launch WhatsApp chat with a specified phone number.
 * Tries the native app deep-link (whatsapp://send?phone=...) first,
 * and gracefully falls back to web (https://wa.me/...) in the device browser.
 */
export const openWhatsAppChat = async (phone?: string | null): Promise<void> => {
  const cleanDigits = normalizePhoneDigits(phone);
  if (!cleanDigits) {
    Alert.alert(
      'WhatsApp Not Connected',
      'This user has not provided a WhatsApp contact number.'
    );
    return;
  }

  const appUrl = `whatsapp://send?phone=${cleanDigits}`;
  const apiWebUrl = `https://api.whatsapp.com/send?phone=${cleanDigits}`;
  const webUrl = `https://wa.me/${cleanDigits}`;

  // 1. Direct attempt with native appUrl
  try {
    const canOpen = await Linking.canOpenURL(appUrl);
    if (canOpen) {
      await Linking.openURL(appUrl);
      return;
    }
  } catch {}

  try {
    await Linking.openURL(appUrl);
    return;
  } catch {}

  // 2. Official WhatsApp API universal redirect (Android intents intercept this to WhatsApp app)
  try {
    await Linking.openURL(apiWebUrl);
    return;
  } catch {}

  // 3. Fallback to web URL in device browser
  try {
    await Linking.openURL(webUrl);
  } catch {
    Alert.alert(
      'WhatsApp Contact',
      `Could not open WhatsApp directly.\n\nPhone: +${cleanDigits}\nLink: ${webUrl}`
    );
  }
};

/**
 * Share WhatsApp contact details
 */
export const shareWhatsAppContact = async (phone?: string | null, name?: string): Promise<void> => {
  const cleanDigits = normalizePhoneDigits(phone);
  if (!cleanDigits) {
    Alert.alert('WhatsApp Not Available', 'No phone number available to share.');
    return;
  }

  try {
    await Share.share({
      message: name
        ? `Contact ${name} on WhatsApp: +${cleanDigits} (https://wa.me/${cleanDigits})`
        : `WhatsApp Contact: +${cleanDigits} (https://wa.me/${cleanDigits})`,
    });
  } catch (error) {
    // User dismissed share dialog
  }
};
