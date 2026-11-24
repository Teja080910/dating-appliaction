import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../theme';
import { t, useTranslation } from '../../../i18n';

export interface PhoneOtpModalProps {
  visible: boolean;
  phoneNumber: string;
  onVerify: (otp: string) => Promise<void> | void;
  onResend: () => Promise<void> | void;
  onClose: () => void;
  loading?: boolean;
  errorMessage?: string | null;
}

const RESEND_TIMEOUT_SECONDS = 30;

export const PhoneOtpModal: React.FC<PhoneOtpModalProps> = ({
  visible,
  phoneNumber,
  onVerify,
  onResend,
  onClose,
  loading = false,
  errorMessage = null,
}) => {
  useTranslation();
  const { themeColors, isDark } = useTheme();
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(RESEND_TIMEOUT_SECONDS);
  const [resending, setResending] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const inputRef = useRef<TextInput>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setOtp('');
      setTimer(RESEND_TIMEOUT_SECONDS);
      setResending(false);
      const timerId = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timerId);
    }
  }, [visible]);

  // Countdown timer for resend
  useEffect(() => {
    if (!visible || timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [visible, timer]);

  const otpArray = useMemo(() => {
    const arr = Array(6).fill('');
    for (let i = 0; i < 6; i++) {
      if (otp[i]) arr[i] = otp[i];
    }
    return arr;
  }, [otp]);

  const handleResend = async () => {
    if (timer > 0 || resending || loading) return;
    setResending(true);
    try {
      await onResend();
      setTimer(RESEND_TIMEOUT_SECONDS);
      setOtp('');
      inputRef.current?.focus();
    } finally {
      setResending(false);
    }
  };

  const handleVerifyPress = () => {
    if (otp.length < 6 || loading) return;
    void onVerify(otp);
  };

  const isComplete = otp.length === 6;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <Pressable style={styles.dismissOverlay} onPress={onClose} />

        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#1C152B' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Close"
          >
            <Icon
              name="close"
              size={20}
              color={isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)'}
            />
          </TouchableOpacity>

          {/* WhatsApp Badge Icon */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={['rgba(37, 211, 102, 0.22)', 'rgba(18, 140, 126, 0.15)']}
              style={styles.iconCircle}
            >
              <Icon name="whatsapp" size={32} color="#25D366" />
            </LinearGradient>
          </View>

          {/* Title */}
          <Text
            style={[
              styles.title,
              { color: isDark ? '#FFFFFF' : '#111827' },
            ]}
          >
            {t('profile.phone_otp.title', { defaultValue: 'Verify WhatsApp Number' })}
          </Text>

          {/* Subtitle with target phone */}
          <Text
            style={[
              styles.subtitle,
              { color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.65)' },
            ]}
          >
            {t('profile.phone_otp.subtitle', { defaultValue: 'Enter the 6-digit code sent to' })}{' '}
            <Text style={styles.phoneHighlight}>{phoneNumber}</Text>
          </Text>

          {/* OTP Code Boxes with native hidden TextInput overlay */}
          <View style={styles.codeBoxesContainer}>
            <View style={styles.codeBoxesRow} pointerEvents="none">
              {otpArray.map((digit, idx) => {
                const isCurrentFocus = isFocused && idx === (otp.length < 6 ? otp.length : 5);
                const isFilled = Boolean(digit);
                return (
                  <View
                    key={idx}
                    style={[
                      styles.codeBox,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.06)'
                          : 'rgba(0, 0, 0, 0.03)',
                        borderColor: isDark
                          ? 'rgba(255, 255, 255, 0.14)'
                          : 'rgba(0, 0, 0, 0.12)',
                      },
                      isCurrentFocus && styles.codeBoxFocused,
                      isFilled && styles.codeBoxFilled,
                    ]}
                  >
                    {digit ? (
                      <Text
                        style={[
                          styles.codeText,
                          { color: isDark ? '#FFFFFF' : '#111827' },
                        ]}
                      >
                        {digit}
                      </Text>
                    ) : isCurrentFocus ? (
                      <View style={styles.cursorBar} />
                    ) : null}
                  </View>
                );
              })}
            </View>

            <TextInput
              ref={inputRef}
              style={styles.hiddenInput}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              maxLength={6}
              value={otp}
              editable={!loading}
              onChangeText={(val) => {
                const clean = val.replace(/\D/g, '').slice(0, 6);
                setOtp(clean);
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </View>

          {/* Error Message */}
          {Boolean(errorMessage) && (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle-outline" size={16} color="#EF4444" style={styles.errorIcon} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Resend Countdown / Link */}
          <View style={styles.resendRow}>
            {timer > 0 ? (
              <Text
                style={[
                  styles.resendTimerText,
                  { color: isDark ? 'rgba(255, 255, 255, 0.55)' : 'rgba(0, 0, 0, 0.5)' },
                ]}
              >
                {t('profile.phone_otp.resend_in', { timer, defaultValue: `Resend in ${timer}s` })}
              </Text>
            ) : (
              <TouchableOpacity
                onPress={handleResend}
                disabled={resending || loading}
                activeOpacity={0.7}
                style={styles.resendBtn}
              >
                {resending ? (
                  <ActivityIndicator size="small" color="#A78BFA" />
                ) : (
                  <>
                    <Icon name="refresh" size={15} color="#A78BFA" style={{ marginRight: 4 }} />
                    <Text style={styles.resendActionText}>
                      {t('profile.phone_otp.resend_code', { defaultValue: 'Resend Code' })}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Actions: Verify & Save */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleVerifyPress}
            disabled={!isComplete || loading}
            style={[
              styles.verifyBtn,
              (!isComplete || loading) && styles.verifyBtnDisabled,
            ]}
          >
            <LinearGradient
              colors={isComplete && !loading ? ['#7C3AED', '#EC4899'] : ['#4C3575', '#4C3575']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.verifyBtnGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.verifyBtnText}>
                  {t('profile.phone_otp.verify_and_save', { defaultValue: 'Verify & Save' })}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Cancel button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            disabled={loading}
            style={styles.cancelBtn}
          >
            <Text
              style={[
                styles.cancelBtnText,
                { color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.55)' },
              ]}
            >
              {t('common.cancel', { defaultValue: 'Cancel' })}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  dismissOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
    zIndex: 10,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(37, 211, 102, 0.35)',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  phoneHighlight: {
    color: '#25D366',
    fontWeight: '700',
  },
  codeBoxesContainer: {
    width: '100%',
    height: 62,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  codeBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  codeBox: {
    flex: 1,
    maxWidth: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3,
  },
  codeBoxFocused: {
    borderColor: '#A78BFA',
    backgroundColor: 'rgba(124, 58, 237, 0.14)',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 3,
  },
  codeBoxFilled: {
    borderColor: '#7C3AED',
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
  },
  codeText: {
    fontSize: 22,
    fontWeight: '700',
  },
  cursorBar: {
    width: 2,
    height: 22,
    backgroundColor: '#A78BFA',
    borderRadius: 1,
  },
  hiddenInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
    fontSize: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    width: '100%',
  },
  errorIcon: {
    marginRight: 6,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#EF4444',
    lineHeight: 18,
    fontWeight: '500',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    minHeight: 24,
  },
  resendTimerText: {
    fontSize: 13.5,
    fontWeight: '500',
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  resendActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#A78BFA',
  },
  verifyBtn: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 10,
  },
  verifyBtnDisabled: {
    opacity: 0.55,
  },
  verifyBtnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PhoneOtpModal;
