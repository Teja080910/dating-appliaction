import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppContext from '../../context/CreateGlobalStateContext';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../../utils/colors';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../api/useAuth';
import { buildRegisterPayload, normalizeMobileNumber } from '../../utils/authPayload';

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

const isRegisterSessionExpiredError = (error: any) => {
  const status = Number(error?.response?.status);
  const message = extractApiErrorMessage(error, '').toLowerCase();
  const hasSessionMessage = 
    message.includes('session expired') ||
    message.includes('expired session') ||
    message.includes('session has expired') ||
    message.includes('invalid session');

  return (status === 400 && hasSessionMessage) || [401, 408, 410, 419, 440].includes(status) || hasSessionMessage;
};

const isInvalidOtpError = (error: any) => {
  const message = extractApiErrorMessage(error, '').toLowerCase();
  return (
    message.includes('invalid otp') ||
    message.includes('invalid code') ||
    message.includes('otp expired') ||
    message.includes('code expired')
  );
};

const OTPScreen = ({ navigation, route }: any) => {
  const { phone, mobile, name, password, confirmPassword, sessionId } = route.params || {};
  const normalizedMobile = normalizeMobileNumber(mobile || phone);
  
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  const [registerSessionId, setRegisterSessionId] = useState<string | null>(null);

  useEffect(() => {
    const initId = typeof sessionId === 'string' && sessionId.trim() ? sessionId.trim() : null;
    if (initId) {
      setRegisterSessionId(initId);
    }
  }, [sessionId]);

  const {
    name: contextName,
    password: contextPassword,
    phoneNumber: contextPhoneNumber,
  } = useContext(AppContext);

  const { sendRegisterOtp, verifyRegisterOtp } = useAuth();

  const effectiveName = String(name ?? contextName ?? '').trim();
  const effectivePassword = String(password ?? contextPassword ?? '').trim();
  const effectiveConfirmPassword = String(confirmPassword ?? effectivePassword).trim();
  const effectiveMobile = normalizeMobileNumber(normalizedMobile || contextPhoneNumber);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.setItem('onboardingStep', 'OTPScreen');
    }, []),
  );

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    const loadSession = async () => {
      const savedSession = await AsyncStorage.getItem("registerSessionId");
      if (savedSession && !registerSessionId) {
        setRegisterSessionId(savedSession);
      }
    };
    loadSession();
  }, [registerSessionId]);

  const handleResend = () => {
    if (timer > 0) return;

    sendRegisterOtp.mutate(
      buildRegisterPayload({
        name: effectiveName,
        mobile: effectiveMobile,
        password: effectivePassword,
        confirmPassword: effectiveConfirmPassword,
        otp: '',
      }),
      {
        onSuccess: async (data: any) => {
          const payload = Array.isArray(data) ? (data[0] || {}) : (data || {});
          const nextSessionId = payload?.sessionId || payload?.data?.sessionId || data?.sessionId;

          if (nextSessionId) {
            const cleanId = String(nextSessionId).trim();
            setRegisterSessionId(cleanId);
            await AsyncStorage.setItem("registerSessionId", cleanId);
          }

          setTimer(30);
          Alert.alert('Code Resent', 'A new verification code has been sent to your mobile.');
        },
        onError: (error: any) => {
          const rawError = extractApiErrorMessage(error, 'Could not resend OTP.');
          Alert.alert('Resend Failed', String(rawError));
        }
      }
    );
  };

  const handleVerify = async () => {
    const trimmedOtp = otp.trim();

    if (trimmedOtp.length < 4) {
      Alert.alert('Enter full OTP');
      return;
    }

    if (!registerSessionId) {
      Alert.alert(
        'Session Expired',
        'Your verification session is missing. Please resend OTP and try again.',
      );
      return;
    }

    setLoading(true);

    try {
      const verifyPayload = {
        mobile: effectiveMobile,
        otp: trimmedOtp,
        sessionId: registerSessionId,
      };

      console.log("VERIFY PAYLOAD:", verifyPayload);

      const verifyData = await verifyRegisterOtp.mutateAsync(verifyPayload);

      console.log("VERIFY SUCCESS:", verifyData);

      // ✅ CLEANUP
      await AsyncStorage.removeItem("registerSessionId");

      // Navigate to Privacy screen to continue onboarding
      navigation.replace("Privacy");

    } catch (error: any) {
      console.log("VERIFY ERROR:", error);
      const msg = extractApiErrorMessage(error, "Verification failed");

      if (isRegisterSessionExpiredError(error)) {
        Alert.alert("Session Expired", "Please resend OTP");
      } else if (isInvalidOtpError(error)) {
        Alert.alert("Invalid OTP", "Please enter correct OTP");
      } else if (msg.toLowerCase().includes('duplicate entry') || msg.toLowerCase().includes('already exists')) {
        Alert.alert(
          "Account Ready", 
          "Your account is already registered. Please proceed to the Login screen.",
          [{ text: "Go to Login", onPress: () => navigation.replace("Login") }]
        );
      } else {
        Alert.alert("Error", msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={[Colors.gradientStart, Colors.gradientMiddle, Colors.gradientEnd]} style={styles.gradient}>
        <View style={styles.topGlow} />
        <View style={styles.bottomGlow} />
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
              <View style={styles.content}>
                <View style={styles.topSection}>
                  <TouchableOpacity 
                    style={styles.backFab} 
                     onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Login')}
                  >
                    <Icon name="chevron-left" size={28} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.headerTitle}>Verification</Text>
                </View>

                <View style={styles.card}>
                  <View style={styles.iconCircle}>
                    <Icon name="shield-star-outline" size={40} color={Colors.primary} />
                  </View>
                  
                  <Text style={styles.eyebrow}>Secure Entry</Text>
                  <Text style={styles.cardTitle}>Verify Mobile</Text>
                  <Text style={styles.cardSubtitle}>
                    Enter the code sent to <Text style={{fontWeight: '700', color: '#333'}}>{normalizedMobile}</Text>
                  </Text>

                  <View style={styles.otpBox}>
                    <View style={styles.inputIconWrap}>
                      <Icon name="key-outline" size={20} color={Colors.primary} />
                    </View>
                    <TextInput
                      placeholder="Enter Code"
                      style={[styles.input, { letterSpacing: 5 }]}
                      placeholderTextColor={Colors.placeholder}
                      keyboardType="number-pad"
                      maxLength={6}
                      value={otp}
                      onChangeText={setOtp}
                    />
                  </View>

                  <TouchableOpacity 
                    style={[styles.verifyBtn, loading && {opacity: 0.7}]}
                    onPress={handleVerify}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.verifyBtnText}>VERIFY NOW</Text>
                    )}
                  </TouchableOpacity>

                  <View style={styles.securityNote}>
                    <Icon name="lock-check-outline" size={16} color={Colors.deepRose} />
                    <Text style={styles.securityNoteText}>We use OTP verification to keep the member space safer and more intentional.</Text>
                  </View>

                  <View style={styles.resendContainer}>
                    <Text style={styles.resendInfo}>Didn't receive code?</Text>
                    <TouchableOpacity onPress={handleResend} disabled={timer > 0}>
                      <Text style={[styles.resendLink, timer > 0 && {color: '#ccc', textDecorationLine: 'none'}]}>
                        {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  topGlow: {
    position: 'absolute',
    top: -70,
    left: -40,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(255, 202, 118, 0.16)',
  },
  bottomGlow: {
    position: 'absolute',
    bottom: 40,
    right: -50,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: 'rgba(255, 99, 138, 0.14)',
  },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 36, paddingBottom: 36 },
  content: { flex: 1, justifyContent: 'center' },
  topSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
  backFab: {
    width: 45, height: 45, borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '900', color: '#fff', marginRight: 45 },
  card: {
    backgroundColor: 'rgba(255,250,248,0.95)',
    borderRadius: 32,
    padding: 28,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.34)',
    shadowColor: '#333',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#FFF0F3',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
  },
  eyebrow: { color: Colors.primary, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 },
  cardTitle: { fontSize: 26, fontWeight: '900', color: Colors.textPrimary, marginBottom: 10 },
  cardSubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 21 },
  otpBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputSurface,
    borderRadius: 18,
    paddingHorizontal: 14,
    marginBottom: 18,
    height: 60,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF0F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: { flex: 1, color: Colors.textPrimary, fontSize: 20, fontWeight: '900', textAlign: 'center' },
  verifyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    height: 58,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.34,
    shadowRadius: 16,
    elevation: 7,
  },
  verifyBtnText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 1.1 },
  securityNote: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#FFF1EA',
  },
  securityNoteText: { flex: 1, marginLeft: 8, color: Colors.deepRose, fontSize: 12, fontWeight: '700', lineHeight: 18 },
  resendContainer: { marginTop: 25, alignItems: 'center' },
  resendInfo: { color: Colors.textSecondary, fontSize: 13, marginBottom: 5 },
  resendLink: { color: Colors.primary, fontSize: 14, fontWeight: 'bold', textDecorationLine: 'underline' },
});

export default OTPScreen;
