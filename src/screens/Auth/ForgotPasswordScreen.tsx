import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Keyboard,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AttractiveLogo from '../../components/AttractiveLogo';
import LanguageSelectorHeader from '../../components/LanguageSelectorHeader';
import { useAuth } from '../../api/useAuth';
import { useAlert } from '../../components/AlertModal';
import { useTheme } from '../../theme';
import {
  validateStrongPassword,
  getPasswordRequirementsSummary,
} from '../../utils/passwordValidation';
import { t, useTranslation } from '../../i18n';
import {
  getPendingDeletionUserIdByEmail,
  removeDeletedAccountLocally,
} from '../../utils/types/AsyncStorage';

const ForgotPasswordScreen = ({ navigation }: any) => {
  useTranslation();
  const { alert, AlertComponent } = useAlert();
  const { themeColors, isDark } = useTheme();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorToastVisible, setErrorToastVisible] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslateY = useRef(new Animated.Value(20)).current;
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showErrorToast = (msg: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setErrorMessage(msg);
    setErrorToastVisible(true);
    toastOpacity.setValue(0);
    toastTranslateY.setValue(20);

    Animated.parallel([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(toastTranslateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    toastTimerRef.current = setTimeout(() => {
      dismissErrorToast();
    }, 4500);
  };

  const dismissErrorToast = () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    Animated.parallel([
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(toastTranslateY, {
        toValue: 20,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      setErrorToastVisible(false);
      setErrorMessage('');
    }, 220);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const { forgotPasswordSendOtp, forgotPasswordReset, activateAccount } = useAuth();
  const passwordValidation = useMemo(() => validateStrongPassword(newPassword), [newPassword]);

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
  const cleanEmail = email.trim();
  const isEmailFormatValid = cleanEmail.length > 0 && EMAIL_REGEX.test(cleanEmail);
  const showEmailError =
    (cleanEmail.length > 0 && !isEmailFormatValid) ||
    (submitted && !isEmailFormatValid);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.setItem('onboardingStep', 'ForgotPassword');
    }, []),
  );

  const handleSendResetCode = async () => {
    setSubmitted(true);
    const cleanLowerEmail = email.trim().toLowerCase();
    if (!cleanLowerEmail || !EMAIL_REGEX.test(cleanLowerEmail)) {
      return;
    }

    setLoading(true);
    Keyboard.dismiss();

    // A deleted account is only deactivated for 30 days. Restore it before
    // asking for the reset code, otherwise the backend reports "not found".
    try {
      const pendingUid = await getPendingDeletionUserIdByEmail(cleanLowerEmail);
      if (pendingUid) {
        await activateAccount.mutateAsync(pendingUid).catch(() => null);
        await removeDeletedAccountLocally(pendingUid, cleanLowerEmail).catch(() => null);
      }
    } catch {}

    forgotPasswordSendOtp.mutate(
      { email: cleanLowerEmail },
      {
        onSuccess: (data: any) => {
          setLoading(false);
          const sId = data?.sessionId || data?.data?.sessionId;
          if (sId) {
            setSessionId(String(sId).trim());
          }
          setStep(2);
          alert(t('auth.forgotpasswordscreen.code_sent'), t('auth.forgotpasswordscreen.we_have_sent_a_verification_code_to_your_email_c', { cleanEmail: cleanLowerEmail }));
        },
        onError: (err: any) => {
          setLoading(false);
          const status = Number(err?.response?.status || err?.status);
          const code = String(err?.response?.data?.code || err?.code || '').toUpperCase();
          const rawMsg = String(err?.response?.data?.message || err?.response?.data?.error || err?.message || '');
          const lowerMsg = rawMsg.toLowerCase();

          const isAccountNotFound =
            status === 404 ||
            code === 'NOT_FOUND' ||
            lowerMsg.includes('not found') ||
            lowerMsg.includes('please register') ||
            lowerMsg.includes('not registered') ||
            lowerMsg.includes('no account');

          const displayMsg =
            isAccountNotFound
              ? (rawMsg && !rawMsg.includes('Request failed')
                  ? rawMsg
                  : 'Account not found. Please register first.')
              : (rawMsg || 'Could not send reset code.');

          showErrorToast(displayMsg);
        },
      },
    );
  };

  const handleResetPassword = () => {
    if (!otpCode.trim()) {
      alert(t('auth.forgotpasswordscreen.missing_code'), t('auth.forgotpasswordscreen.please_enter_the_reset_code_sent_to_your_email'));
      return;
    }
    if (!newPassword.trim()) {
      alert(t('auth.forgotpasswordscreen.missing_password'), t('auth.forgotpasswordscreen.please_enter_your_new_password'));
      return;
    }
    if (newPassword !== confirmPassword) {
      alert(t('auth.forgotpasswordscreen.mismatch'), t('auth.forgotpasswordscreen.passwords_do_not_match'));
      return;
    }
    if (!passwordValidation.isValid) {
      alert(
        t('auth.forgotpasswordscreen.weak_password', { defaultValue: 'Weak Password' }),
        getPasswordRequirementsSummary(passwordValidation)
      );
      return;
    }

    setLoading(true);
    Keyboard.dismiss();
    const cleanEmail = email.trim().toLowerCase();
    forgotPasswordReset.mutate(
      {
        email: cleanEmail,
        otp: otpCode.trim(),
        newPassword: newPassword.trim(),
        confirmPassword: confirmPassword.trim(),
        sessionId: sessionId || undefined,
      },
      {
        onSuccess: () => {
          setLoading(false);
          alert(t('auth.forgotpasswordscreen.password_updated'), t('auth.forgotpasswordscreen.your_password_has_been_reset_successfully_please'), [
            { text: t('auth.forgotpasswordscreen.login'), onPress: () => navigation.navigate('Login') },
          ]);
        },
        onError: (err: any) => {
          setLoading(false);
          const msg = err?.response?.data?.message || err?.message || 'Invalid or expired reset code.';
          alert(t('auth.forgotpasswordscreen.reset_failed'), msg);
        },
      },
    );
  };

  // STEP 1: Screenshot 2 layout (Full Theme Gradient with Amara Logo)
  if (step === 1) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <LinearGradient
          colors={['#180B2B', '#2E1065', '#4C1D95', '#6D28D9', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradient}
        >
          <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
              style={styles.keyboard}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* Top Language Dropdown (clean, centered as in Glambu) */}
                <View style={styles.topLangRow}>
                  <LanguageSelectorHeader color="#FFFFFF" />
                </View>

                {/* Main Content Area (Brand + Form unified) */}
                <View style={styles.mainContent}>
                  {/* Official Amara Brand Title */}
                  <View style={styles.brandContainer}>
                    <Text style={styles.brandTitle}>{t('home.homeheader.amara')}</Text>
                    <Text style={styles.pageHeading}>{t('auth.forgotpasswordscreen.reset_password')}</Text>
                  </View>

                  {/* Input Card & Buttons */}
                  <View style={styles.formContainer}>
                    <View style={[styles.inputCard, showEmailError && styles.inputCardWithError]}>
                      <Text style={styles.inputLabel}>{t('auth.forgotpasswordscreen.email')}</Text>
                      <View style={styles.inputFieldRow}>
                        <Icon name="email-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                        <TextInput
                          style={styles.textInput}
                          placeholder="your.email@example.com"
                          placeholderTextColor="#9CA3AF"
                          autoCapitalize="none"
                          keyboardType="email-address"
                          value={email}
                          onChangeText={(val) => {
                            setEmail(val);
                            if (errorToastVisible) dismissErrorToast();
                          }}
                        />
                      </View>
                    </View>
                    {showEmailError && (
                      <Text style={styles.validationErrorText}>
                        {t('auth.loginscreen.invalid_email_address', { defaultValue: 'Invalid email address' })}
                      </Text>
                    )}

                    {/* Send Reset Code Button (Solid White Pill Button) */}
                    <TouchableOpacity
                      style={styles.sendResetBtn}
                      onPress={handleSendResetCode}
                      activeOpacity={0.88}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#180B2B" size="small" />
                      ) : (
                        <Text style={styles.sendResetBtnText}>{t('auth.forgotpasswordscreen.send_reset_code')}</Text>
                      )}
                    </TouchableOpacity>

                    {/* Back to Login Button (Transparent Outline Pill Button) */}
                    <TouchableOpacity
                      style={styles.backToLoginBtn}
                      onPress={() => navigation.navigate('Login')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.backToLoginBtnText}>{t('auth.forgotpasswordscreen.back_to_login')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Footer */}
                <View style={styles.footerContainer}>
                  <Text style={styles.termsText}>{t('auth.forgotpasswordscreen.by_signing_up_you_agree_to_our')}{' '}
                    <Text
                      style={styles.underlineLink}
                      onPress={() => navigation.navigate('PrivacyPolicy')}
                    >{t('auth.forgotpasswordscreen.terms')}</Text>{' '}
                    and{' '}
                    <Text
                      style={styles.underlineLink}
                      onPress={() => navigation.navigate('PrivacyPolicy')}
                    >{t('auth.forgotpasswordscreen.privacy_policy')}</Text>
                  </Text>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </LinearGradient>

        {/* Floating Bottom Toast with Small Amara Logo */}
        {errorToastVisible && (
          <Animated.View
            style={[
              styles.errorToastContainer,
              {
                opacity: toastOpacity,
                transform: [{ translateY: toastTranslateY }],
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                dismissErrorToast();
                if (errorMessage.toLowerCase().includes('register')) {
                  navigation.navigate('Register');
                }
              }}
              style={styles.errorToastInner}
            >
              <View style={styles.toastLogoWrap}>
                <AttractiveLogo size={26} />
              </View>
              <Text style={styles.errorToastText} numberOfLines={2}>
                {errorMessage}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {AlertComponent}
      </View>
    );
  }

  // STEP 2: Consistent Glambu Layout with Amara Theme
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={['#180B2B', '#2E1065', '#4C1D95', '#6D28D9', '#7C3AED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            style={styles.keyboard}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Top Header with Back Chevron */}
              <View style={styles.step2TopBar}>
                <TouchableOpacity
                  style={styles.step2BackBtn}
                  onPress={() => setStep(1)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Icon name="chevron-left" size={32} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Main Content Area */}
              <View style={styles.mainContent}>
                {/* Brand Title */}
                <View style={styles.brandContainer}>
                  <Text style={styles.brandTitle}>{t('home.homeheader.amara')}</Text>
                  <Text style={styles.pageHeading}>{t('auth.forgotpasswordscreen.reset_your_password')}</Text>
                  <Text style={styles.step2SubtitleText}>
                    {t('auth.forgotpasswordscreen.choose_a_new_password_well_email_you_a_code_to_confirm')}
                  </Text>
                </View>

                {/* Form Input Cards */}
                <View style={styles.formContainer}>
                  {/* Reset Code Input Card */}
                  <View style={styles.inputCard}>
                    <Text style={styles.inputLabel}>{t('auth.forgotpasswordscreen.reset_code_e_g_123456')}</Text>
                    <View style={styles.inputFieldRow}>
                      <Icon name="shield-key-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="123456"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="number-pad"
                        value={otpCode}
                        onChangeText={setOtpCode}
                      />
                    </View>
                  </View>

                  {/* New Password Input Card */}
                  <View style={styles.inputCard}>
                    <Text style={styles.inputLabel}>{t('auth.forgotpasswordscreen.new_password')}</Text>
                    <View style={styles.inputFieldRow}>
                      <Icon name="lock-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="••••••••••••"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry={!showNewPassword}
                        value={newPassword}
                        onChangeText={setNewPassword}
                      />
                      <TouchableOpacity
                        onPress={() => setShowNewPassword(!showNewPassword)}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      >
                        <Icon
                          name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={20}
                          color="#8E8E93"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Password Requirements Helper / Checklist */}
                  {newPassword.length > 0 && !passwordValidation.isValid && (
                    <View style={styles.passwordHintCard}>
                      <Text style={styles.passwordHintTitle}>Password Requirements</Text>
                      <View style={styles.passwordReqRow}>
                        {passwordValidation.requirements.map((req) => (
                          <View key={req.id} style={styles.reqChip}>
                            <Icon
                              name={req.met ? 'check-circle' : 'circle-outline'}
                              size={12}
                              color={req.met ? '#10B981' : '#9CA3AF'}
                              style={{ marginRight: 4 }}
                            />
                            <Text style={[styles.reqChipText, req.met && styles.reqChipTextMet]}>
                              {req.label}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Confirm Password Input Card */}
                  <View style={styles.inputCard}>
                    <Text style={styles.inputLabel}>{t('auth.forgotpasswordscreen.confirm_password')}</Text>
                    <View style={styles.inputFieldRow}>
                      <Icon name="lock-check-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="••••••••••••"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry={!showConfirmPassword}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                      />
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      >
                        <Icon
                          name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={20}
                          color="#8E8E93"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Primary Reset Password Button */}
                  <TouchableOpacity
                    style={styles.sendResetBtn}
                    onPress={handleResetPassword}
                    activeOpacity={0.88}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#180B2B" size="small" />
                    ) : (
                      <Text style={styles.sendResetBtnText}>{t('auth.forgotpasswordscreen.save', { defaultValue: 'Save' })}</Text>
                    )}
                  </TouchableOpacity>

                  {/* Secondary Back to Login Button */}
                  <TouchableOpacity
                    style={styles.backToLoginBtn}
                    onPress={() => navigation.navigate('Login')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.backToLoginBtnText}>{t('auth.forgotpasswordscreen.back_to_login')}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Footer */}
              <View style={styles.footerContainer}>
                <Text style={styles.termsText}>{t('auth.forgotpasswordscreen.by_signing_up_you_agree_to_our')}{' '}
                  <Text
                    style={styles.underlineLink}
                    onPress={() => navigation.navigate('PrivacyPolicy')}
                  >{t('auth.forgotpasswordscreen.terms')}</Text>{' '}
                  and{' '}
                  <Text
                    style={styles.underlineLink}
                    onPress={() => navigation.navigate('PrivacyPolicy')}
                  >{t('auth.forgotpasswordscreen.privacy_policy')}</Text>
                </Text>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>

      {/* Floating Bottom Toast with Small Amara Logo */}
      {errorToastVisible && (
        <Animated.View
          style={[
            styles.errorToastContainer,
            {
              opacity: toastOpacity,
              transform: [{ translateY: toastTranslateY }],
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              dismissErrorToast();
              if (errorMessage.toLowerCase().includes('register')) {
                navigation.navigate('Register');
              }
            }}
            style={styles.errorToastInner}
          >
            <View style={styles.toastLogoWrap}>
              <AttractiveLogo size={26} />
            </View>
            <Text style={styles.errorToastText} numberOfLines={2}>
              {errorMessage}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {AlertComponent}
    </View>
  );
};

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  topLangRow: {
    alignItems: 'center',
    marginBottom: 10,
  },
  step2TopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  step2BackBtn: {
    padding: 4,
    marginLeft: -4,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 10,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 26,
  },
  logoHaloWrap: {
    marginBottom: 8,
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  pageHeading: {
    fontSize: 21,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 10,
    textAlign: 'center',
  },
  step2SubtitleText: {
    fontSize: 13.5,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  formContainer: {
    width: '100%',
  },
  inputCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 12,
  },
  inputCardWithError: {
    marginBottom: 5,
  },
  validationErrorText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '400',
    marginTop: -2,
    marginBottom: 10,
    marginLeft: 18,
    letterSpacing: 0.2,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  inputFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: '#111827',
    paddingVertical: Platform.OS === 'android' ? 2 : 4,
    paddingHorizontal: 0,
  },
  sendResetBtn: {
    backgroundColor: '#FFFFFF',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  sendResetBtnText: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#180B2B',
    letterSpacing: 0.2,
  },
  backToLoginBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  backToLoginBtnText: {
    fontSize: 15.5,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 6,
    paddingHorizontal: 16,
  },
  termsText: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 18,
  },
  underlineLink: {
    textDecorationLine: 'underline',
    color: '#FFFFFF',
    fontWeight: '700',
  },
  passwordHintCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 11,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  passwordHintTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  passwordReqRow: {
    flexDirection: 'column',
    gap: 4,
  },
  reqChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 1,
  },
  reqChipText: {
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.65)',
    fontWeight: '500',
  },
  reqChipTextMet: {
    color: '#10B981',
    fontWeight: '600',
  },
  errorToastContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 54 : 66,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  errorToastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#160E1A',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    maxWidth: '90%',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    elevation: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
  },
  toastLogoWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  errorToastText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: 0.1,
    lineHeight: 19,
    textAlign: 'center',
    flexShrink: 1,
  },
});
