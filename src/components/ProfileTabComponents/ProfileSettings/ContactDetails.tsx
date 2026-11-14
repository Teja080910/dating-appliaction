import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Linking,
  ActivityIndicator,
  AppState,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserId } from '../../../utils/sessionHelper';
import { useTheme } from '../../../theme';
import { useTelegram, useTelegramBotName, useMyTelegramStatus, fetchAmaraBotName, fetchAmaraBotLink, DEFAULT_AMARA_BOT_USERNAME } from '../../../api/useTelegram';
import { useSendWhatsappOtp, useVerifyWhatsappOtp, extractSessionIdFromResponse } from '../../../api/useProfile';
import { useAlert } from '../../AlertModal';
import { t, useTranslation } from '../../../i18n';
import { openAmaraBot } from '../../../utils/telegramHelper';
import { extractTelegram } from '../../../utils/whatsappHelper';

export interface CountryItem {
  name: string;
  code: string;
  flag: string;
}

export const COUNTRIES_LIST: CountryItem[] = [
  // 1. English (en)
  { name: 'India', code: '+91', flag: '🇮🇳' },
  { name: 'United States', code: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { name: 'Canada', code: '+1', flag: '🇨🇦' },
  { name: 'Australia', code: '+61', flag: '🇦🇺' },
  // 2. Spanish (es)
  { name: 'Spain', code: '+34', flag: '🇪🇸' },
  { name: 'Mexico', code: '+52', flag: '🇲🇽' },
  { name: 'Colombia', code: '+57', flag: '🇨🇴' },
  { name: 'Argentina', code: '+54', flag: '🇦🇷' },
  // 3. Portuguese (pt)
  { name: 'Brazil', code: '+55', flag: '🇧🇷' },
  { name: 'Portugal', code: '+351', flag: '🇵🇹' },
  // 4. German (de)
  { name: 'Germany', code: '+49', flag: '🇩🇪' },
  { name: 'Austria', code: '+43', flag: '🇦🇹' },
  { name: 'Switzerland', code: '+41', flag: '🇨🇭' },
  // 5. Romanian (ro)
  { name: 'Romania', code: '+40', flag: '🇷🇴' },
  { name: 'Moldova', code: '+373', flag: '🇲🇩' },
  // 6. Russian (ru)
  { name: 'Russia', code: '+7', flag: '🇷🇺' },
  { name: 'Kazakhstan', code: '+7', flag: '🇰🇿' },
  { name: 'Belarus', code: '+375', flag: '🇧🇾' },
  // 7. French (fr)
  { name: 'France', code: '+33', flag: '🇫🇷' },
  { name: 'Belgium', code: '+32', flag: '🇧🇪' },
  // 8. Chinese (zh)
  { name: 'China', code: '+86', flag: '🇨🇳' },
  { name: 'Taiwan', code: '+886', flag: '🇹🇼' },
  { name: 'Hong Kong', code: '+852', flag: '🇭🇰' },
  { name: 'Singapore', code: '+65', flag: '🇸🇬' },
  // 9. Japanese (ja)
  { name: 'Japan', code: '+81', flag: '🇯🇵' },
  // 10. Indonesian (id)
  { name: 'Indonesia', code: '+62', flag: '🇮🇩' },
  { name: 'Malaysia', code: '+60', flag: '🇲🇾' },
  // Additional international hubs
  { name: 'United Arab Emirates', code: '+971', flag: '🇦🇪' },
  { name: 'Saudi Arabia', code: '+966', flag: '🇸🇦' },
  { name: 'Italy', code: '+39', flag: '🇮🇹' },
];

export const getDefaultCountryForLanguage = (langCode: string): CountryItem => {
  switch ((langCode || '').toLowerCase()) {
    case 'es':
      return { name: 'Spain', code: '+34', flag: '🇪🇸' };
    case 'pt':
      return { name: 'Brazil', code: '+55', flag: '🇧🇷' };
    case 'de':
      return { name: 'Germany', code: '+49', flag: '🇩🇪' };
    case 'ro':
      return { name: 'Romania', code: '+40', flag: '🇷🇴' };
    case 'ru':
      return { name: 'Russia', code: '+7', flag: '🇷🇺' };
    case 'fr':
      return { name: 'France', code: '+33', flag: '🇫🇷' };
    case 'zh':
      return { name: 'China', code: '+86', flag: '🇨🇳' };
    case 'ja':
      return { name: 'Japan', code: '+81', flag: '🇯🇵' };
    case 'id':
      return { name: 'Indonesia', code: '+62', flag: '🇮🇩' };
    case 'en':
    default:
      return { name: 'India', code: '+91', flag: '🇮🇳' };
  }
};

export const parsePhoneNumberAndCountry = (rawPhone?: string | null) => {
  if (!rawPhone) return null;
  const str = String(rawPhone).trim();
  if (!str) return null;

  const digits = str.replace(/\D/g, '');

  // 1. Check Indian mobile number with single or repeated 91 prefix (e.g. 91919014701586, +91 919014701586, 919014701586)
  const indianRepeatMatch = digits.match(/^(?:91)+([6-9]\d{9})$/);
  if (indianRepeatMatch) {
    const india = COUNTRIES_LIST.find((c) => c.code === '+91');
    return {
      country: india,
      code: '+91',
      name: 'India',
      flag: '🇮🇳',
      number: indianRepeatMatch[1],
    };
  }

  // 2. 10-digit Indian mobile number
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    const india = COUNTRIES_LIST.find((c) => c.code === '+91');
    return {
      country: india,
      code: '+91',
      name: 'India',
      flag: '🇮🇳',
      number: digits,
    };
  }

  // 3. Match country code with leading +
  const sorted = [...COUNTRIES_LIST].sort((a, b) => b.code.length - a.code.length);
  const matched = sorted.find((c) => str.startsWith(c.code));
  if (matched) {
    let remaining = str.slice(matched.code.length).trim();
    const codeDigits = matched.code.replace('+', '');
    // If remaining still starts with duplicate country code digits (e.g. +91 919014701586)
    while (remaining.startsWith(codeDigits) && remaining.length >= codeDigits.length + 7) {
      remaining = remaining.slice(codeDigits.length).trim();
    }
    return {
      country: matched,
      code: matched.code,
      name: matched.name,
      flag: matched.flag,
      number: remaining.replace(/[^\d\s-]/g, '').trim(),
    };
  }

  // 4. Match country code without leading + (e.g. 447123456789)
  const matchedWithoutPlus = sorted.find((c) => {
    const cd = c.code.replace('+', '');
    return digits.startsWith(cd) && digits.length >= cd.length + 7;
  });
  if (matchedWithoutPlus) {
    const cd = matchedWithoutPlus.code.replace('+', '');
    let remainingDigits = digits.slice(cd.length);
    while (remainingDigits.startsWith(cd) && remainingDigits.length >= cd.length + 7) {
      remainingDigits = remainingDigits.slice(cd.length);
    }
    return {
      country: matchedWithoutPlus,
      code: matchedWithoutPlus.code,
      name: matchedWithoutPlus.name,
      flag: matchedWithoutPlus.flag,
      number: remainingDigits,
    };
  }

  const match = str.match(/^(\+\d{1,4})\s*(.*)$/);
  if (match) {
    return {
      country: null,
      code: match[1],
      name: null,
      flag: null,
      number: match[2].replace(/[^\d\s-]/g, '').trim(),
    };
  }
  return {
    country: null,
    code: null,
    name: null,
    flag: null,
    number: str.replace(/^[^\d+]+/, '').replace(/^-+/, '').replace(/[^\d\s-]/g, '').trim(),
  };
};

/**
 * Extracts pure national number digits for display and text entry,
 * stripping any prepended country dial codes (e.g. 919014701586 -> 9014701586).
 */
export const extractNationalNumber = (
  rawNumber?: string | null,
  currentCountryCode?: string | null
): string => {
  if (!rawNumber) return '';
  const str = String(rawNumber).trim();
  if (!str || str.includes('@') || /[a-zA-Z]/.test(str)) return '';

  const digits = str.replace(/\D/g, '');
  if (!digits) return '';

  const ccDigits = String(currentCountryCode || '').replace(/\D/g, '');

  // 1. Indian number with single or repeated 91 prefix (e.g. 919014701586, 91919014701586, +91 919014701586)
  if (ccDigits === '91' || !ccDigits) {
    const indianRepeat = digits.match(/^(?:91)+([6-9]\d{9})$/);
    if (indianRepeat) {
      return indianRepeat[1];
    }
    // 11 digits starting with 0 (STD prefix)
    if (digits.length === 11 && digits.startsWith('0') && /^[6-9]/.test(digits.slice(1))) {
      return digits.slice(1);
    }
    // Standard 10-digit Indian mobile
    if (digits.length === 10 && /^[6-9]/.test(digits)) {
      return digits;
    }
  }

  // 2. Starts with current country code digits (e.g. +44 for UK, +1 for US)
  if (ccDigits && digits.startsWith(ccDigits) && digits.length >= ccDigits.length + 7) {
    let clean = digits;
    while (clean.startsWith(ccDigits) && clean.length >= ccDigits.length + 7) {
      clean = clean.slice(ccDigits.length);
    }
    return clean;
  }

  return digits;
};

interface ContactDetailsProps {
  showWhatsApp?: boolean;
  countryCode?: string;
  setCountryCode?: (code: string) => void;
  countryName?: string;
  setCountryName?: (name: string) => void;
  countryFlag?: string;
  setCountryFlag?: (flag: string) => void;
  phoneNumber?: string;
  setPhoneNumber?: (num: string) => void;
  telegramUsername: string;
  setTelegramUsername: (username: string) => void;
  isVerified?: boolean;
  setIsVerified?: (val: boolean) => void;
}

const ContactDetails: React.FC<ContactDetailsProps> = ({
  showWhatsApp = false,
  countryCode = '+44',
  setCountryCode = () => {},
  countryName = 'United Kingdom',
  setCountryName = () => {},
  countryFlag = '🇬🇧',
  setCountryFlag = () => {},
  phoneNumber = '',
  setPhoneNumber = () => {},
  telegramUsername,
  setTelegramUsername,
  isVerified = true,
  setIsVerified = () => {},
}) => {
  useTranslation();
  const { themeColors, isDark } = useTheme();
  const { alert, AlertComponent } = useAlert();
  const { disconnectTelegram } = useTelegram();
  const { data: dynamicBotName } = useTelegramBotName();
  const { data: myTgStatus, refetch: refetchTgStatus } = useMyTelegramStatus();
  const sendWhatsappOtp = useSendWhatsappOtp();
  const verifyWhatsappOtp = useVerifyWhatsappOtp();

  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const isDisconnectedRef = useRef(false);
  const [storedTelegram, setStoredTelegram] = useState('');
  const cleanConnected = isDisconnectedRef.current
    ? ''
    : extractTelegram(telegramUsername, myTgStatus?.telegramUsername, storedTelegram);
  const [tgLoading, setTgLoading] = useState(false);

  // Inline OTP states
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [inlineOtp, setInlineOtp] = useState('');
  const [sessionId, setSessionId] = useState('');
  const sessionIdRef = useRef('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    (async () => {
      const storedSid = await AsyncStorage.getItem('whatsapp_otp_session_id').catch(() => null);
      if (storedSid && !sessionIdRef.current) {
        setSessionId(storedSid);
        sessionIdRef.current = storedSid;
      }
    })();
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const uid = await getUserId().catch(() => null);
        const [uTg, atTg, legTg, legAtTg] = await Promise.all([
          uid ? AsyncStorage.getItem(`user_telegram_${uid}`).catch(() => null) : null,
          uid ? AsyncStorage.getItem(`@telegram_username_${uid}`).catch(() => null) : null,
          AsyncStorage.getItem('telegramUsername').catch(() => null),
          AsyncStorage.getItem('@telegram_username').catch(() => null),
        ]);
        const cand = [uTg, atTg, legTg, legAtTg].find((val) => {
          if (!val) return false;
          const c = String(val).trim().replace(/^@+/, '');
          const n = c.toUpperCase();
          return c && n !== 'NONE' && n !== 'NULL' && n !== 'UNDEFINED' && n !== '-' && n !== 'N/A';
        });
        if (isMounted && cand) {
          const clean = String(cand).trim().replace(/^@+/, '');
          setStoredTelegram(clean);
          if (!telegramUsername) {
            setTelegramUsername(clean);
          }
        }
      } catch {}
    })();
    return () => {
      isMounted = false;
    };
  }, [telegramUsername, setTelegramUsername]);

  useEffect(() => {
    if (isDisconnectedRef.current) return;
    const resolved = extractTelegram(myTgStatus?.telegramUsername, storedTelegram);
    if (resolved && !telegramUsername) {
      setTelegramUsername(resolved);
    }
  }, [myTgStatus?.telegramUsername, storedTelegram, telegramUsername, setTelegramUsername]);

  // When returning from Telegram app to Amara, automatically refresh status
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refetchTgStatus?.();
      }
    });
    return () => sub.remove();
  }, [refetchTgStatus]);

  const filteredCountries = COUNTRIES_LIST.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.code.includes(countrySearch)
  );

  const handleSelectCountry = (country: CountryItem) => {
    setCountryCode(country.code);
    setCountryName(country.name);
    setCountryFlag(country.flag);
    setCountryModalVisible(false);
  };

  const handleConnectTelegramPress = async () => {
    isDisconnectedRef.current = false;
    setTgLoading(true);
    // 1. Fetch bot link with 1-click user connect parameter (?start=USER_{userId})
    try {
      const botLink = await fetchAmaraBotLink();
      await openAmaraBot(botLink);
    } catch {
      const activeBot = await fetchAmaraBotName().catch(() => dynamicBotName || DEFAULT_AMARA_BOT_USERNAME);
      await openAmaraBot(activeBot);
    } finally {
      setTgLoading(false);
    }
  };

  const handleDisconnectTelegram = async () => {
    isDisconnectedRef.current = true;
    setTgLoading(true);
    setTelegramUsername('');
    setStoredTelegram('');
    try {
      await disconnectTelegram.mutateAsync({ userId: '' });
      await refetchTgStatus?.();
    } catch (error: any) {
      console.warn('Telegram Disconnect Error:', error);
      setTelegramUsername('');
      setStoredTelegram('');
    } finally {
      setTgLoading(false);
    }
  };

  const handlePhoneNumberChange = (val: string) => {
    if (isVerified) {
      setIsVerified(false);
    }
    if (!val.trim()) {
      setShowOtpInput(false);
    }
    setOtpSent(false);
    setInlineOtp('');
    setOtpError('');
    const raw = val.trim();
    if (raw.startsWith('+')) {
      const parsed = parsePhoneNumberAndCountry(raw);
      if (parsed) {
        if (parsed.code) setCountryCode(parsed.code);
        if (parsed.name) setCountryName(parsed.name);
        if (parsed.flag) setCountryFlag(parsed.flag);
        setPhoneNumber(parsed.number);
        return;
      }
    }
    const cleanNational = extractNationalNumber(val, countryCode);
    setPhoneNumber(cleanNational);
  };

  const handleSendOtpInline = async () => {
    const cleanDigits = extractNationalNumber(phoneNumber, countryCode);
    if (!cleanDigits || cleanDigits.length < 7) {
      alert(
        t('profile.profilesettingsscreen.invalid_phone_title', { defaultValue: 'Invalid Phone Number' }),
        t('profile.profilesettingsscreen.invalid_phone_desc', { defaultValue: 'Please enter a valid mobile number.' })
      );
      return;
    }
    const fullPhone = `${countryCode} ${cleanDigits}`;
    setShowOtpInput(true);
    setSendingOtp(true);
    setOtpError('');
    setInlineOtp('');
    try {
      const res = await sendWhatsappOtp.mutateAsync({ mobile: fullPhone });
      const sid = extractSessionIdFromResponse(res);
      if (sid) {
        setSessionId(sid);
        sessionIdRef.current = sid;
        await AsyncStorage.setItem('whatsapp_otp_session_id', sid).catch(() => null);
      }
      setOtpSent(true);
      setCountdown(30);
      alert(
        t('profile.phone_otp.code_sent_title', { defaultValue: 'Code Sent' }),
        t('profile.phone_otp.new_code_sent_desc', {
          defaultValue: 'A verification code has been sent to your WhatsApp number. Please enter the latest 6-digit code.',
        })
      );
    } catch (err: any) {
      const status = Number(err?.response?.status || err?.status || 0);
      const rawMsg = String(err?.response?.data?.message || err?.message || '');
      const lower = rawMsg.toLowerCase();
      const isGenericDbConflict = lower.includes('duplicate or conflicting data') || lower.includes('conflicting data');
      const isDuplicateNumber =
        !isGenericDbConflict &&
        (lower.includes('already exists') ||
          lower.includes('already registered') ||
          lower.includes('already in use') ||
          lower.includes('already linked') ||
          lower.includes('number already'));

      if (isDuplicateNumber) {
        setOtpError(
          t('profile.profilesettingsscreen.phone_already_exists_desc', {
            defaultValue: 'This number is already linked to an account in the database. If this is your number, tap "Save" below to update your profile.',
          })
        );
      } else {
        setOtpError(
          isGenericDbConflict
            ? 'Server error: Database conflict on OTP service. Please contact backend team.'
            : rawMsg ||
              t('profile.phone_otp.send_failed_desc', {
                defaultValue: 'Could not send verification code to this WhatsApp number. Please check the number and try again.',
              })
        );
      }
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtpInline = async () => {
    const cleanDigits = extractNationalNumber(phoneNumber, countryCode);
    const fullPhone = `${countryCode} ${cleanDigits}`;
    if (!inlineOtp || inlineOtp.trim().length < 4) return;
    setVerifyingOtp(true);
    setOtpError('');

    let effectiveSid = sessionId || sessionIdRef.current;
    if (!effectiveSid) {
      effectiveSid = (await AsyncStorage.getItem('whatsapp_otp_session_id').catch(() => null)) || '';
    }

    try {
      await verifyWhatsappOtp.mutateAsync({
        mobile: fullPhone,
        otp: inlineOtp.trim(),
        sessionId: effectiveSid || undefined,
      });
      setIsVerified(true);
      setOtpSent(false);
      setShowOtpInput(false);
      setInlineOtp('');
      await AsyncStorage.removeItem('whatsapp_otp_session_id').catch(() => null);
      alert(
        t('profile.phone_otp.verified_title', { defaultValue: 'WhatsApp Verified' }),
        t('profile.phone_otp.verified_desc', { defaultValue: 'Your WhatsApp number has been verified successfully!' })
      );
    } catch (err: any) {
      const rawMsg = String(err?.response?.data?.message || err?.response?.data?.error || err?.message || '');
      const isExpiredOrInvalidSession =
        rawMsg.toLowerCase().includes('session') ||
        rawMsg.toLowerCase().includes('expired') ||
        rawMsg.toLowerCase().includes('invalid');

      if (isExpiredOrInvalidSession) {
        setOtpError(
          t('profile.phone_otp.session_expired_action', {
            defaultValue: 'This verification session has expired. Please tap "Resend Code" above to receive a fresh code.',
          })
        );
      } else {
        setOtpError(
          rawMsg ||
            t('profile.phone_otp.invalid_code', {
              defaultValue: 'Invalid verification code. Please check and try again.',
            })
        );
      }
    } finally {
      setVerifyingOtp(false);
    }
  };

  const nationalDigits = extractNationalNumber(phoneNumber, countryCode);

  return (
    <View style={styles.container}>
      {/* Section Title: Contact details */}
      <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{t('profile.contactdetails.contact_details')}</Text>

      {showWhatsApp && (
        <>
          {/* Field Label: WhatsApp number */}
          <Text style={[styles.fieldLabel, { color: isDark ? '#D1D5DB' : '#374151' }]}>{t('profile.contactdetails.whatsapp_number')}</Text>

          {/* WhatsApp input card matching Screenshot 1 */}
          <View
            style={[
              styles.whatsAppCard,
              {
                backgroundColor: isDark ? themeColors.surfaceLight : '#FFFFFF',
                borderColor: isDark ? themeColors.borderLight : '#E5E7EB',
              },
            ]}
          >
            {/* Country Selector Row */}
            <TouchableOpacity
              style={styles.countryRow}
              onPress={() => {
                setCountrySearch('');
                setCountryModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.countryFlag}>{countryFlag}</Text>
              <Text style={[styles.countryName, { color: themeColors.text }]}>
                {countryName}
              </Text>
              <Feather name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Card Horizontal Divider */}
            <View
              style={[
                styles.cardDivider,
                { backgroundColor: isDark ? themeColors.borderLight : '#E5E7EB' },
              ]}
            />

            {/* Dial Code & Number Row */}
            <View style={styles.numberRow}>
              <Text style={[styles.dialCode, { color: themeColors.text }]}>
                {countryCode}
              </Text>
              <View
                style={[
                  styles.verticalDivider,
                  { backgroundColor: isDark ? themeColors.borderLight : '#E5E7EB' },
                ]}
              />
              <TextInput
                style={[styles.numberInput, { color: themeColors.text }]}
                placeholder="1234567890"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                value={nationalDigits}
                onChangeText={handlePhoneNumberChange}
              />

              {/* Verify Button or Verified Badge */}
              {isVerified && nationalDigits.length >= 7 ? (
                <View style={styles.verifiedBadge}>
                  <Icon name="check-circle" size={15} color="#10B981" style={{ marginRight: 4 }} />
                  <Text style={styles.verifiedText}>
                    {t('profile.contactdetails.verified', { defaultValue: 'Verified' })}
                  </Text>
                </View>
              ) : nationalDigits.length >= 7 ? (
                <TouchableOpacity
                  style={[styles.verifyInlineBtn, sendingOtp && { opacity: 0.7 }]}
                  onPress={handleSendOtpInline}
                  disabled={sendingOtp}
                  activeOpacity={0.8}
                >
                  {sendingOtp ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.verifyInlineBtnText}>
                      {showOtpInput || otpSent
                        ? countdown > 0
                          ? `${countdown}s`
                          : t('profile.phone_otp.resend_code', { defaultValue: 'Resend' })
                        : t('profile.contactdetails.verify', { defaultValue: 'Verify' })}
                    </Text>
                  )}
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Helper link if user already received OTP before tapping verify */}
            {!showOtpInput && !otpSent && !isVerified && nationalDigits.length >= 7 && (
              <TouchableOpacity
                onPress={() => setShowOtpInput(true)}
                style={styles.alreadyHaveOtpRow}
                activeOpacity={0.7}
              >
                <Text style={styles.alreadyHaveOtpText}>
                  {t('profile.phone_otp.already_have_otp', {
                    defaultValue: 'Already have an OTP? Enter code',
                  })}
                </Text>
              </TouchableOpacity>
            )}

            {/* Inline OTP Verification Section */}
            {(showOtpInput || otpSent) && !isVerified && (
              <View
                style={[
                  styles.inlineOtpCard,
                  {
                    backgroundColor: isDark ? 'rgba(139, 92, 246, 0.08)' : '#F5F3FF',
                    borderTopColor: isDark ? themeColors.borderLight : '#E5E7EB',
                  },
                ]}
              >
                <View style={styles.inlineOtpHeader}>
                  <Text
                    style={[
                      styles.inlineOtpSub,
                      { color: isDark ? '#D1D5DB' : '#4B5563' },
                    ]}
                  >
                    {t('profile.phone_otp.enter_otp_sent_to', {
                      defaultValue: 'Enter 6-digit OTP sent to',
                    })}{' '}
                    <Text style={{ fontWeight: '700', color: '#25D366' }}>
                      {countryCode} {nationalDigits}
                    </Text>
                  </Text>
                </View>

                <View style={styles.inlineOtpInputRow}>
                  <TextInput
                    style={[
                      styles.inlineOtpField,
                      {
                        color: isDark ? '#FFFFFF' : '#111827',
                        backgroundColor: isDark ? '#1F1B2E' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255,255,255,0.18)' : '#D1D5DB',
                      },
                    ]}
                    placeholder={t('profile.phone_otp.six_digit_placeholder', {
                      defaultValue: 'Enter 6-digit OTP',
                    })}
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={inlineOtp}
                    autoFocus={true}
                    onChangeText={(val) => {
                      setInlineOtp(val.replace(/\D/g, '').slice(0, 6));
                      setOtpError('');
                    }}
                  />
                  <TouchableOpacity
                    style={[
                      styles.inlineOtpSubmitBtn,
                      (inlineOtp.trim().length < 4 || verifyingOtp) && styles.inlineOtpSubmitBtnDisabled,
                    ]}
                    onPress={handleVerifyOtpInline}
                    disabled={inlineOtp.trim().length < 4 || verifyingOtp}
                    activeOpacity={0.85}
                  >
                    {verifyingOtp ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.inlineOtpSubmitBtnText}>
                        {t('profile.phone_otp.validate_btn', { defaultValue: 'Validate' })}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                {Boolean(otpError) && (
                  <View style={styles.inlineOtpErrorContainer}>
                    <View style={styles.inlineOtpErrorRow}>
                      <Icon name="alert-circle-outline" size={14} color="#EF4444" style={{ marginRight: 4, marginTop: 1 }} />
                      <Text style={styles.inlineOtpErrorText}>{otpError}</Text>
                    </View>
                    {(otpError.toLowerCase().includes('expired') || otpError.toLowerCase().includes('session')) && (
                      <TouchableOpacity
                        style={[styles.resendActionBtn, sendingOtp && { opacity: 0.7 }]}
                        onPress={handleSendOtpInline}
                        disabled={sendingOtp}
                        activeOpacity={0.8}
                      >
                        {sendingOtp ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Icon name="refresh" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                            <Text style={styles.resendActionBtnText}>
                              {t('profile.phone_otp.resend_code_now', { defaultValue: 'Resend Code Now' })}
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Centered OR divider */}
          <View style={styles.orRow}>
            <View
              style={[
                styles.orLine,
                { backgroundColor: isDark ? themeColors.borderLight : '#E5E7EB' },
              ]}
            />
            <Text style={[styles.orText, { color: isDark ? '#9CA3AF' : '#9CA3AF' }]}>{t('profile.contactdetails.or')}</Text>
            <View
              style={[
                styles.orLine,
                { backgroundColor: isDark ? themeColors.borderLight : '#E5E7EB' },
              ]}
            />
          </View>
        </>
      )}

      {/* Field Label: Your Telegram */}
      <Text style={[styles.fieldLabel, { color: isDark ? '#D1D5DB' : '#374151' }]}>{t('profile.contactdetails.your_telegram')}</Text>

      {/* Telegram Card matching Screenshot 1 */}
      <View
        style={[
          styles.telegramCard,
          {
            borderColor: isDark ? 'rgba(56, 189, 248, 0.45)' : '#8FD2F8',
          },
        ]}
      >
        {/* Top button: Connect / Disconnect Telegram */}
        <TouchableOpacity
          style={styles.telegramConnectBtn}
          activeOpacity={0.85}
          onPress={cleanConnected ? handleDisconnectTelegram : handleConnectTelegramPress}
          disabled={tgLoading}
        >
          {tgLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
          ) : (
            <Icon name="send" size={19} color="#FFFFFF" style={styles.sendIcon} />
          )}
          <Text style={styles.telegramConnectBtnText}>
            {cleanConnected
              ? t('profile.contactdetails.disconnect_telegram', { defaultValue: 'Disconnect Telegram' })
              : t('profile.contactdetails.connect_telegram')}
          </Text>
        </TouchableOpacity>

        {/* Bottom status area */}
        <View
          style={[
            styles.telegramStatusArea,
            {
              backgroundColor: isDark ? 'rgba(46, 165, 232, 0.12)' : '#E5F3FD',
            },
          ]}
        >
          <Text
            style={[
              styles.telegramStatusText,
              { color: isDark ? '#BAE6FD' : '#0A3960' },
            ]}
          >
            {cleanConnected
              ? t('profile.contactdetails.connected_to', { username: cleanConnected, defaultValue: `Connected to: @${cleanConnected}` })
              : `${t('profile.contactdetails.status')} ${t('profile.contactdetails.not_connected', { defaultValue: 'Not connected' })}`}
          </Text>
        </View>
      </View>

      {/* Country Selection Modal */}
      {showWhatsApp && (
        <Modal
          visible={countryModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setCountryModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setCountryModalVisible(false)}
          >
            <View
              style={[
                styles.countryModalCard,
                { backgroundColor: isDark ? '#1F1B2E' : '#FFFFFF' },
              ]}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.countryModalHeader}>
                <Text
                  style={[
                    styles.countryModalTitle,
                    { color: isDark ? '#FFFFFF' : '#111827' },
                  ]}
                >{t('profile.contactdetails.select_country')}</Text>
                <TouchableOpacity
                  onPress={() => setCountryModalVisible(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon name="close" size={22} color={isDark ? '#FFFFFF' : '#111827'} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={[
                  styles.countrySearchInput,
                  {
                    color: isDark ? '#FFFFFF' : '#111827',
                    backgroundColor: isDark ? '#2D2845' : '#F3F4F6',
                  },
                ]}
                placeholder={t('profile.contactdetails.search_country_or_code')}
                placeholderTextColor="#9CA3AF"
                value={countrySearch}
                onChangeText={setCountrySearch}
              />

              <FlatList
                data={filteredCountries}
                keyExtractor={(item) => item.code + item.name}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isSelected = item.code === countryCode && item.name === countryName;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.countryItem,
                        isSelected && {
                          backgroundColor: isDark
                            ? 'rgba(124, 58, 237, 0.2)'
                            : 'rgba(124, 58, 237, 0.08)',
                        },
                      ]}
                      onPress={() => handleSelectCountry(item)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.countryItemFlag}>{item.flag}</Text>
                      <Text
                        style={[
                          styles.countryItemName,
                          { color: isDark ? '#FFFFFF' : '#111827' },
                        ]}
                      >
                        {item.name}
                      </Text>
                      <Text style={styles.countryItemCode}>{item.code}</Text>
                      {isSelected && (
                        <Icon
                          name="check"
                          size={18}
                          color="#7C3AED"
                          style={{ marginLeft: 8 }}
                        />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {AlertComponent}
    </View>
  );
};

export default ContactDetails;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  fieldLabel: {
    fontSize: 15.5,
    fontWeight: '600',
    marginBottom: 10,
  },
  whatsAppCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  countryFlag: {
    fontSize: 20,
    marginRight: 10,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  cardDivider: {
    height: 1,
    width: '100%',
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
  },
  dialCode: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 36,
  },
  verticalDivider: {
    width: 1,
    height: 22,
    marginHorizontal: 14,
  },
  numberInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 0,
  },
  verifyInlineBtn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  verifyInlineBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginLeft: 8,
  },
  verifiedText: {
    color: '#10B981',
    fontSize: 12.5,
    fontWeight: '700',
  },
  alreadyHaveOtpRow: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 4,
  },
  alreadyHaveOtpText: {
    fontSize: 12.5,
    color: '#8B5CF6',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  inlineOtpCard: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inlineOtpHeader: {
    marginBottom: 10,
  },
  inlineOtpSub: {
    fontSize: 13,
    lineHeight: 18,
  },
  inlineOtpInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineOtpField: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 2,
    marginRight: 10,
  },
  inlineOtpSubmitBtn: {
    backgroundColor: '#8B5CF6',
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineOtpSubmitBtnDisabled: {
    backgroundColor: '#6B7280',
    opacity: 0.6,
  },
  inlineOtpSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  inlineOtpErrorContainer: {
    marginTop: 8,
  },
  inlineOtpErrorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  inlineOtpErrorText: {
    color: '#EF4444',
    fontSize: 12.5,
    fontWeight: '500',
    flex: 1,
    lineHeight: 17,
  },
  resendActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  resendActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },
  orLine: {
    flex: 1,
    height: 1,
  },
  orText: {
    marginHorizontal: 14,
    fontSize: 13,
    fontWeight: '700',
  },
  telegramCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  telegramConnectBtn: {
    backgroundColor: '#2EA5E8',
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    marginRight: 8,
    transform: [{ rotate: '-45deg' }],
  },
  telegramConnectBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  telegramStatusArea: {
    paddingVertical: 13,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  telegramStatusText: {
    fontSize: 15,
    fontWeight: '500',
  },
  telegramStatusValue: {
    fontWeight: '600',
  },
  telegramStatusConnected: {
    color: '#059669',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  countryModalCard: {
    width: '100%',
    maxHeight: '75%',
    borderRadius: 20,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  countryModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  countryModalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  countrySearchInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 12,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginVertical: 2,
  },
  countryItemFlag: {
    fontSize: 20,
    marginRight: 10,
  },
  countryItemName: {
    flex: 1,
    fontSize: 15.5,
    fontWeight: '500',
  },
  countryItemCode: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
});
