import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../api/useAuth';
import { useAlert } from '../../components/AlertModal';
import { normalizeMobileNumber } from '../../utils/authPayload';

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

  React.useEffect(() => {
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
            formatForgotPasswordError(
              error,
              'Failed to send reset code. Try again later.',
            ),
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
    forgotPasswordReset.mutate(
      { mobile: normalizedMobile, otp: otp.trim(), newPassword: newPassword.trim() },
      {
        onSuccess: () => {
          setLoading(false);
          alert('Password Changed', 'Your password has been successfully reset. You can now login with your new password.');
          navigation.navigate('Login');
        },
        onError: (error: any) => {
          setLoading(false);
          alert(
            'Reset Failed',
            formatForgotPasswordError(
              error,
              'Invalid or expired code. Please try again.',
            ),
          );
        },
      },
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#FF5A79', '#FF8E53']} style={styles.gradient}>
        <SafeAreaView style={{ flex: 1 }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
              
              <View style={styles.header}>
                <TouchableOpacity style={styles.backFab} onPress={() => step === 2 ? setStep(1) : navigation.goBack()}>
                  <Icon name="chevron-left" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{step === 1 ? 'Recovery' : 'Set Password'}</Text>
              </View>

              <View style={styles.card}>
                <View style={styles.iconCircle}>
                  <Icon name={step === 1 ? "lock-reset" : "shield-key-outline"} size={40} color="#FF5A79" />
                </View>

                <Text style={styles.cardTitle}>{step === 1 ? 'Forgot Password?' : 'Create New Password'}</Text>
                <Text style={styles.cardSubtitle}>
                  {step === 1 
                    ? "Don't worry, it happens. Enter your mobile number to get back into your account."
                    : `Enter the code we sent to ${mobile} and choose a strong new password.`}
                </Text>

                {step === 1 ? (
                  <>
                    <View style={styles.inputField}>
                      <Icon name="phone-outline" size={22} color="#FF5A79" />
                      <TextInput
                        placeholder="Mobile Number"
                        placeholderTextColor="#666"
                        style={styles.input}
                        keyboardType="phone-pad"
                        value={mobile}
                        onChangeText={setMobile}
                      />
                    </View>

                    <TouchableOpacity 
                      style={[styles.actionBtn, loading && {opacity: 0.7}]} 
                      onPress={handleRequestReset}
                      disabled={loading}
                    >
                      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>GET RESET CODE</Text>}
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={styles.inputField}>
                      <Icon name="numeric" size={22} color="#FF5A79" />
                      <TextInput
                        placeholder="4-digit Code"
                        placeholderTextColor="#666"
                        style={styles.input}
                        keyboardType="number-pad"
                        maxLength={6}
                        value={otp}
                        onChangeText={setOtp}
                      />
                    </View>

                    <View style={styles.inputField}>
                      <Icon name="lock-outline" size={22} color="#FF5A79" />
                      <TextInput
                        placeholder="New Password"
                        placeholderTextColor="#666"
                        style={styles.input}
                        secureTextEntry={!showPassword}
                        value={newPassword}
                        onChangeText={setNewPassword}
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Icon name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#FF5A79" />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity 
                      style={[styles.actionBtn, loading && {opacity: 0.7}]} 
                      onPress={handleResetPassword}
                      disabled={loading}
                    >
                      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>RESET PASSWORD</Text>}
                    </TouchableOpacity>

                    {timer > 0 ? (
                      <Text style={styles.timerText}>Resend code in {timer}s</Text>
                    ) : (
                      <TouchableOpacity style={{marginTop: 15}} onPress={handleRequestReset}>
                        <Text style={styles.resendLink}>Resend Code</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>

              <TouchableOpacity style={styles.loginBack} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginBackText}>Back to Login</Text>
              </TouchableOpacity>
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
  scrollContent: { flexGrow: 1, paddingHorizontal: 25, paddingTop: 40, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 40 },
  backFab: {
    width: 45, height: 45, borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '900', color: '#fff', marginRight: 45 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#FFF0F3',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: { fontSize: 22, fontWeight: '800', color: '#333', marginBottom: 10 },
  cardSubtitle: { fontSize: 14, color: '#777', textAlign: 'center', marginBottom: 30, lineHeight: 20 },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 55,
    width: '100%',
  },
  input: { flex: 1, color: '#333', fontSize: 15, marginLeft: 10 },
  actionBtn: {
    backgroundColor: '#FF5A79',
    borderRadius: 15,
    height: 55,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#FF5A79',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
  timerText: { marginTop: 20, color: '#999', fontSize: 13 },
  resendLink: { marginTop: 20, color: '#FF5A79', fontWeight: 'bold', textDecorationLine: 'underline' },
  loginBack: { marginTop: 40, alignSelf: 'center' },
  loginBackText: { color: '#fff', fontWeight: 'bold', fontSize: 15, textDecorationLine: 'underline' },
});

export default ForgotPasswordScreen;
