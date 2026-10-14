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
      alert('Missing Info', 'Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      alert('Invalid Email', 'Please enter a valid email address.');
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
          alert('Code Sent', `We have sent a verification code to your email: ${cleanEmail}.`);
        },
        onError: (err: any) => {
          setLoading(false);
          const msg = err?.response?.data?.message || err?.message || 'Could not send reset code.';
          alert('Request Failed', msg);
        },
      },
    );
  };

  const handleResetPassword = () => {
    if (!otpCode.trim()) {
      alert('Missing Code', 'Please enter the reset code sent to your email.');
      return;
    }
    if (!newPassword.trim()) {
      alert('Missing Password', 'Please enter your new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Mismatch', 'Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      alert('Weak Password', 'Password must be at least 6 characters.');
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
          alert('Password Updated', 'Your password has been reset successfully. Please log in.', [
            { text: t('auth.forgotpasswordscreen.login'), onPress: () => navigation.navigate('Login') },
          ]);
        },
        onError: (err: any) => {
          setLoading(false);
          const msg = err?.response?.data?.message || err?.message || 'Invalid or expired reset code.';
          alert('Reset Failed', msg);
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
                {/* Top Language Pill Dropdown */}
                <View style={styles.topLangRow}>
                  <View style={styles.langPill}>
                    <LanguageSelectorHeader color="#FFFFFF" />
                  </View>
                </View>

                {/* Main Content Area (Brand + Form unified) */}
                <View style={styles.mainContent}>
                  {/* Official Amara Brand Logo & Title */}
                  <View style={styles.brandContainer}>
                    <View style={styles.logoHaloWrap}>
                      <AttractiveLogo size={70} />
                    </View>
                    <Text style={styles.brandTitle}>{t('home.homeheader.amara')}</Text>
                    <Text style={styles.pageHeading}>{t('auth.forgotpasswordscreen.reset_password')}</Text>
                  </View>

                  {/* Input Card & Buttons */}
                  <View style={styles.formContainer}>
                    <View style={styles.inputCard}>
                      <Text style={styles.inputLabel}>{t('auth.forgotpasswordscreen.email')}</Text>
                      <View style={styles.inputFieldRow}>
                        <Icon name="email-outline" size={20} color="#7C3AED" style={styles.inputIcon} />
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

                    {/* Send Reset Code Button */}
                    <TouchableOpacity
                      style={styles.sendResetBtn}
                      onPress={handleSendResetCode}
                      activeOpacity={0.88}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#5B21B6" size="small" />
                      ) : (
                        <Text style={styles.sendResetBtnText}>{t('auth.forgotpasswordscreen.send_reset_code')}</Text>
                      )}
                    </TouchableOpacity>

                    {/* Back to Login Button */}
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

  // STEP 2: Screenshot 3 layout (Clean Theme)
  return (
    <SafeAreaView style={[styles.step2Container, { backgroundColor: isDark ? '#0F0D1A' : '#FFFFFF' }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#0F0D1A' : '#FFFFFF'}
      />
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.step2ScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Back Chevron */}
          <TouchableOpacity
            style={styles.step2BackBtn}
            onPress={() => setStep(1)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Icon name="chevron-left" size={32} color={isDark ? '#FFFFFF' : '#111827'} />
          </TouchableOpacity>

          {/* Heading & Subtitle */}
          <Text style={[styles.step2Title, { color: isDark ? '#FFFFFF' : '#111827' }]}>{t('auth.forgotpasswordscreen.reset_your_password')}</Text>
          <Text style={[styles.step2Subtitle, { color: isDark ? '#9CA3AF' : '#4B5563' }]}>{t('auth.forgotpasswordscreen.choose_a_new_password_well_email_you_a_code_to_confirm')}</Text>

          {/* Input Fields */}
          <View style={styles.step2InputsGroup}>
            {/* Reset Code Input */}
            <View style={[styles.step2InputBox, { backgroundColor: isDark ? '#1F1B2E' : '#F3F4F6' }]}>
              <Icon name="shield-key-outline" size={20} color="#7C3AED" style={styles.inputIcon} />
              <TextInput
                style={[styles.step2Input, { color: isDark ? '#FFFFFF' : '#111827' }]}
                placeholder={t('auth.forgotpasswordscreen.reset_code_e_g_123456')}
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                value={otpCode}
                onChangeText={setOtpCode}
              />
            </View>

            {/* New Password */}
            <View style={[styles.step2InputBox, { backgroundColor: isDark ? '#1F1B2E' : '#F3F4F6' }]}>
              <Icon name="lock-outline" size={20} color="#7C3AED" style={styles.inputIcon} />
              <TextInput
                style={[styles.step2Input, { color: isDark ? '#FFFFFF' : '#111827' }]}
                placeholder={t('auth.forgotpasswordscreen.new_password')}
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
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <View style={[styles.step2InputBox, { backgroundColor: isDark ? '#1F1B2E' : '#F3F4F6' }]}>
              <Icon name="lock-outline" size={20} color="#7C3AED" style={styles.inputIcon} />
              <TextInput
                style={[styles.step2Input, { color: isDark ? '#FFFFFF' : '#111827' }]}
                placeholder={t('auth.forgotpasswordscreen.confirm_password')}
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
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Spacer to push buttons to bottom */}
          <View style={styles.step2Spacer} />

          {/* Bottom Action Buttons */}
          <View style={styles.step2BtnGroup}>
            <TouchableOpacity
              style={styles.step2PrimaryBtn}
              onPress={handleResetPassword}
              activeOpacity={0.88}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.step2PrimaryBtnText}>{t('auth.forgotpasswordscreen.send_code')}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.step2SecondaryBtn,
                {
                  backgroundColor: isDark ? '#1F1B2E' : '#FFFFFF',
                  borderColor: isDark ? '#374151' : '#E5E7EB',
                },
              ]}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.step2SecondaryBtnText,
                  { color: isDark ? '#FFFFFF' : '#111827' },
                ]}
              >{t('auth.forgotpasswordscreen.back_to_login')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {AlertComponent}
    </SafeAreaView>
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
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 10 : 6,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  topLangRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  langPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 4,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 10,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoHaloWrap: {
    marginBottom: 8,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  pageHeading: {
    fontSize: 19,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.95)',
    marginTop: 6,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.6,
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
    fontWeight: '500',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  sendResetBtnText: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#5B21B6',
    letterSpacing: 0.3,
  },
  backToLoginBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  backToLoginBtnText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 4,
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

  // Step 2 Styles (Matching Screenshot 3)
  step2Container: {
    flex: 1,
  },
  step2ScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  step2BackBtn: {
    alignSelf: 'flex-start',
    marginBottom: 18,
    marginLeft: -6,
  },
  step2Title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  step2Subtitle: {
    fontSize: 14.5,
    lineHeight: 21,
    marginBottom: 30,
  },
  step2InputsGroup: {
    gap: 14,
  },
  step2InputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
  },
  step2Input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  step2Spacer: {
    flex: 1,
    minHeight: 40,
  },
  step2BtnGroup: {
    gap: 14,
    marginTop: 20,
  },
  step2PrimaryBtn: {
    backgroundColor: '#7C3AED',
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  step2PrimaryBtnText: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  step2SecondaryBtn: {
    borderWidth: 1.2,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  step2SecondaryBtnText: {
    fontSize: 16.5,
    fontWeight: '600',
  },
});
