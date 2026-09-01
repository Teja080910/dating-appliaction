import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../api/useAuth';
import { useAlert } from '../../components/AlertModal';
import { normalizeMobileNumber } from '../../utils/authPayload';
import { Colors, Spacing, Shadows } from '../../theme';

const extractApiErrorMessage = (error: any, fallback: string) => {
  const responseData = error?.response?.data;
  return (
    responseData?.message ||
    responseData?.error ||
    (typeof responseData === 'string' ? responseData : null) ||
    error?.message ||
    fallback
  );
};

const formatForgotPasswordError = (error: any, fallback: string) => {
  const status = Number(error?.response?.status);
  if (status === 403) {
    return 'Password recovery is currently blocked by the server. Please try again later or contact support.';
  }
  return extractApiErrorMessage(error, fallback);
};

const ForgotPasswordScreen = ({ navigation }: any) => {
  const { alert, AlertComponent } = useAlert();
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  const { forgotPasswordSendOtp, forgotPasswordReset } = useAuth();

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.setItem('onboardingStep', 'ForgotPassword');
    }, []),
  );

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleRequestReset = () => {
    const normalizedMobile = normalizeMobileNumber(mobile);

    if (!normalizedMobile || normalizedMobile.length < 10) {
      alert('Invalid Number', 'Please enter a valid mobile number associated with your account.');
      return;
    }

    setLoading(true);
    Keyboard.dismiss();
    forgotPasswordSendOtp.mutate(
      { mobile: normalizedMobile },
      {
        onSuccess: () => {
          setLoading(false);
          setStep(2);
          setTimer(30);
          alert('Code Sent', 'We have sent a reset code to your mobile number.');
        },
        onError: (error: any) => {
          setLoading(false);
          alert(
            'Recovery Unavailable',
            formatForgotPasswordError(error, 'Failed to send reset code. Try again later.'),
          );
        },
      },
    );
  };

  const handleResetPassword = () => {
    const normalizedMobile = normalizeMobileNumber(mobile);

    if (!otp || !newPassword) {
      alert('Missing Info', 'Please provide both the 4-digit code and your new password.');
      return;
    }

    setLoading(true);
    Keyboard.dismiss();
    forgotPasswordReset.mutate(
      { mobile: normalizedMobile, otp: otp.trim(), newPassword: newPassword.trim() },
      {
        onSuccess: () => {
          setLoading(false);
          alert('Password Changed', 'Your password has been successfully reset. You can now login with your new password.');
          setTimeout(() => navigation.navigate('Login'), 3000);
        },
        onError: (error: any) => {
          setLoading(false);
          alert(
            'Reset Failed',
            formatForgotPasswordError(error, 'Invalid or expired code. Please try again.'),
          );
        },
      },
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={[Colors.background, Colors.surface]} style={styles.gradient}>
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboard}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              <View style={styles.content}>
                <View style={styles.topSection}>
                  <TouchableOpacity
                    style={styles.backFab}
                    onPress={() => step === 2 ? setStep(1) : navigation.goBack()}>
                    <Icon name="chevron-left" size={28} color={Colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.headerTitle}>
                    {step === 1 ? 'Account Recovery' : 'Reset Password'}
                  </Text>
                </View>

                <View style={styles.card}>
                  <View style={styles.iconCircle}>
                    <Icon
                      name={step === 1 ? 'lock-reset' : 'shield-key-outline'}
                      size={40}
                      color={Colors.primary}
                    />
                  </View>

                  <Text style={styles.eyebrow}>
                    {step === 1 ? 'FORGOT PASSWORD' : 'SET NEW PASSWORD'}
                  </Text>
                  <Text style={styles.cardTitle}>
                    {step === 1 ? 'Recovery' : 'Create New Password'}
                  </Text>
                  <Text style={styles.cardSubtitle}>
                    {step === 1
                      ? "Don't worry, it happens. Enter your mobile number to get back into your account."
                      : `Enter the code we sent to ${mobile} and choose a strong new password.`}
                  </Text>

                  {step === 1 ? (
                    <>
                      <View style={styles.inputBox}>
                        <View style={styles.inputIconWrap}>
                          <Icon name="phone-outline" size={20} color={Colors.primary} />
                        </View>
                        <TextInput
                          placeholder="Mobile Number"
                          placeholderTextColor={Colors.textMuted}
                          style={styles.input}
                          keyboardType="phone-pad"
                          value={mobile}
                          onChangeText={setMobile}
                        />
                      </View>

                      <TouchableOpacity
                        style={[styles.actionBtn, loading && styles.buttonDisabled]}
                        onPress={handleRequestReset}
                        disabled={loading}>
                        <LinearGradient
                          colors={[Colors.primary, Colors.secondary]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.actionBtnGradient}>
                          {loading ? (
                            <ActivityIndicator color={Colors.white} />
                          ) : (
                            <Text style={styles.actionBtnText}>GET RESET CODE</Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <View style={styles.inputBox}>
                        <View style={styles.inputIconWrap}>
                          <Icon name="key-outline" size={20} color={Colors.primary} />
                        </View>
                        <TextInput
                          placeholder="4-digit Code"
                          placeholderTextColor={Colors.textMuted}
                          style={styles.input}
                          keyboardType="number-pad"
                          maxLength={6}
                          value={otp}
                          onChangeText={setOtp}
                        />
                      </View>

                      <View style={styles.inputBox}>
                        <View style={styles.inputIconWrap}>
                          <Icon name="lock-outline" size={20} color={Colors.primary} />
                        </View>
                        <TextInput
                          placeholder="New Password"
                          placeholderTextColor={Colors.textMuted}
                          style={styles.input}
                          secureTextEntry={!showPassword}
                          value={newPassword}
                          onChangeText={setNewPassword}
                        />
                        <TouchableOpacity
                          onPress={() => setShowPassword(!showPassword)}
                          style={styles.eyeToggle}>
                          <Icon
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color={Colors.textMuted}
                          />
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={[styles.actionBtn, loading && styles.buttonDisabled]}
                        onPress={handleResetPassword}
                        disabled={loading}>
                        <LinearGradient
                          colors={[Colors.primary, Colors.secondary]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.actionBtnGradient}>
                          {loading ? (
                            <ActivityIndicator color={Colors.white} />
                          ) : (
                            <Text style={styles.actionBtnText}>RESET PASSWORD</Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>

                      <View style={styles.resendContainer}>
                        {timer > 0 ? (
                          <Text style={styles.resendInfo}>Resend code in {timer}s</Text>
                        ) : (
                          <TouchableOpacity onPress={handleRequestReset}>
                            <Text style={styles.resendLink}>Resend Code</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.loginBack}
                  onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.loginBackText}>Back to Login</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
      {AlertComponent}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  keyboard: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xl,
  },
  content: { flex: 1, justifyContent: 'center' },
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  backFab: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: Colors.glass,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '900',
    color: Colors.text,
    marginRight: 45,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radiusXxl,
    padding: Spacing.xl,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    ...Shadows.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.glass,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  eyebrow: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.text,
    marginBottom: 10,
  },
  cardSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 21,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: Spacing.radiusMd,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    height: 60,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  inputIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.glass,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    marginLeft: Spacing.md,
    color: Colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  eyeToggle: { padding: Spacing.sm },
  actionBtn: {
    borderRadius: Spacing.radiusMd,
    height: 58,
    width: '100%',
    overflow: 'hidden',
    ...Shadows.md,
  },
  actionBtnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    color: Colors.white,
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1.1,
  },
  buttonDisabled: { opacity: 0.7 },
  resendContainer: { marginTop: Spacing.xl, alignItems: 'center' },
  resendInfo: { color: Colors.textSecondary, fontSize: 13 },
  resendLink: { color: Colors.primary, fontSize: 14, fontWeight: 'bold', textDecorationLine: 'underline' },
  loginBack: { marginTop: Spacing.xxl, alignItems: 'center' },
  loginBackText: { color: Colors.primary, fontSize: 14, fontWeight: '700' },
});

export default ForgotPasswordScreen;
