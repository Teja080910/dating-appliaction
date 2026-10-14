import React, { useState, useCallback, useMemo } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AttractiveLogo from '../../components/AttractiveLogo';
import LanguageSelectorHeader from '../../components/LanguageSelectorHeader';
import { useAuth } from '../../api/useAuth';
import { useAlert } from '../../components/AlertModal';
import { useTheme } from '../../theme';
import { t, useTranslation } from '../../i18n';

const ForgotPasswordScreen = ({ navigation }: any) => {
  useTranslation();
  const { alert, AlertComponent } = useAlert();
  const { themeColors, isDark } = useTheme();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('sailakshmiborra45@gmail.com');
  const [otpCode, setOtpCode] = useState('123456');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { forgotPasswordSendOtp, forgotPasswordReset } = useAuth();

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.setItem('onboardingStep', 'ForgotPassword');
    }, []),
  );

  const handleSendResetCode = () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      alert(t('auth.forgotpasswordscreen.missing_info'), t('auth.forgotpasswordscreen.please_enter_your_email_address'));
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      alert(t('auth.forgotpasswordscreen.invalid_email'), t('auth.forgotpasswordscreen.please_enter_a_valid_email_address'));
      return;
    }

    setLoading(true);
    Keyboard.dismiss();
    forgotPasswordSendOtp.mutate(
      { email: cleanEmail },
      {
        onSuccess: () => {
          setLoading(false);
          setStep(2);
          alert(t('auth.forgotpasswordscreen.code_sent'), t('auth.forgotpasswordscreen.we_have_sent_a_verification_code_to_your_email_c', { cleanEmail }));
        },
        onError: (err: any) => {
          setLoading(false);
          const msg = err?.response?.data?.message || err?.message || 'Could not send reset code.';
          alert(t('auth.forgotpasswordscreen.request_failed'), msg);
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
    if (newPassword.length < 6) {
      alert(t('auth.forgotpasswordscreen.weak_password'), t('auth.forgotpasswordscreen.password_must_be_at_least_6_characters'));
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
                  {/* Official Amara Brand Logo & Title */}
                  <View style={styles.brandContainer}>
                    <View style={styles.logoHaloWrap}>
                      <AttractiveLogo size={66} />
                    </View>
                    <Text style={styles.brandTitle}>{t('home.homeheader.amara')}</Text>
                    <Text style={styles.pageHeading}>{t('auth.forgotpasswordscreen.reset_password')}</Text>
                  </View>

                  {/* Input Card & Buttons */}
                  <View style={styles.formContainer}>
                    <View style={styles.inputCard}>
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
                          onChangeText={setEmail}
                        />
                      </View>
                    </View>

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
                {/* Brand Logo & Title */}
                <View style={styles.brandContainer}>
                  <View style={styles.logoHaloWrap}>
                    <AttractiveLogo size={66} />
                  </View>
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
                      <Text style={styles.sendResetBtnText}>{t('auth.forgotpasswordscreen.send_code')}</Text>
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
});
