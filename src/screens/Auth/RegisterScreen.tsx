import React, { useState, useContext, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppContext from '../../context/CreateGlobalStateContext';
import AttractiveLogo from '../../components/AttractiveLogo';
import { useAuth } from '../../api/useAuth';
import { Colors } from '../../utils/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildRegisterPayload, normalizeMobileNumber } from '../../utils/authPayload';

const RegisterScreen = ({ navigation }: any) => {
  const { name, setName, password, setPassword, phoneNumber, setPhoneNumber } = useContext(AppContext);

  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { sendRegisterOtp } = useAuth();

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.setItem('onboardingStep', 'Register');
    }, []),
  );

  const handleRegister = async () => {
    const normalizedMobile = normalizeMobileNumber(phoneNumber);

    if (!name.trim() || !normalizedMobile || !password.trim()) {
      Alert.alert('Missing Info', 'Please fill all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Passwords Mismatch', 'Passwords do not match.');
      return;
    }

    if (normalizedMobile.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await sendRegisterOtp.mutateAsync(
        buildRegisterPayload({
          name,
          mobile: normalizedMobile,
          password,
          confirmPassword,
          otp: '',
        })
      );

      setLoading(false);
      console.log('OTP Sent Response:', res);
      
      const payload = Array.isArray(res) ? (res[0] || {}) : (res || {});
      const sessionId = payload?.sessionId || payload?.data?.sessionId || res?.sessionId;

      if (!sessionId) {
        Alert.alert(
          'Registration Failed',
          'Verification session could not be created. Please try sending OTP again.',
        );
        return;
      }

      await AsyncStorage.setItem('registerSessionId', String(sessionId).trim());

      navigation.navigate('OTPScreen', { 
        mobile: normalizedMobile,
        name: name.trim(),
        password: password.trim(),
        confirmPassword: confirmPassword.trim(),
        sessionId: sessionId || null,
      });
    } catch (error: any) {
      setLoading(false);
      const rawError = error.response?.data?.message || error.response?.data || error.message;
      Alert.alert('Registration Failed', typeof rawError === 'object' ? JSON.stringify(rawError) : String(rawError));
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
            <View style={styles.content}>
              <View style={styles.topSection}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backFab}>
                  <Icon name="chevron-left" size={28} color="#fff" />
                </TouchableOpacity>
                <AttractiveLogo />
                <Text style={styles.branding}>AMARA</Text>
                <Text style={styles.slogan}>The exclusive space for real chemistry.</Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.eyebrow}>GET STARTED</Text>
                <Text style={styles.cardTitle}>Create Your Elegant Profile</Text>
                <Text style={styles.cardSubtitle}>Join a community of intentional individuals seeking genuine connections.</Text>

                <View style={styles.inputGroup}>
                  <View style={styles.inputBox}>
                    <View style={styles.inputIconWrap}>
                      <Icon name="account-outline" size={20} color={Colors.primary} />
                    </View>
                    <TextInput
                      placeholder="Your Full Name"
                      style={styles.input}
                      placeholderTextColor={Colors.placeholder}
                      value={name}
                      onChangeText={setName}
                    />
                  </View>

                  <View style={styles.inputBox}>
                    <View style={styles.inputIconWrap}>
                      <Icon name="phone-outline" size={20} color={Colors.primary} />
                    </View>
                    <TextInput
                      placeholder="Mobile Number"
                      style={styles.input}
                      placeholderTextColor={Colors.placeholder}
                      keyboardType="number-pad"
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                    />
                  </View>

                  <View style={styles.inputBox}>
                    <View style={styles.inputIconWrap}>
                      <Icon name="lock-outline" size={20} color={Colors.primary} />
                    </View>
                    <TextInput
                      placeholder="Enter Password"
                      style={styles.input}
                      placeholderTextColor={Colors.placeholder}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeToggle}>
                      <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.placeholder} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputBox}>
                    <View style={styles.inputIconWrap}>
                      <Icon name="lock-check-outline" size={20} color={Colors.primary} />
                    </View>
                    <TextInput
                      placeholder="Confirm Password"
                      style={styles.input}
                      placeholderTextColor={Colors.placeholder}
                      secureTextEntry={!showPassword}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                  </View>
                </View>

                <TouchableOpacity style={[styles.registerBtn, loading && styles.buttonDisabled]} onPress={handleRegister} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerBtnText}>CREATE ACCOUNT</Text>}
                </TouchableOpacity>

                <View style={styles.footerRow}>
                  <Text style={styles.footerInfo}>Already have an account?</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.loginLink}>Login now</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.termNote}>
                  By proceeding, you agree to our <Text style={styles.boldNote}>Terms of Service</Text> and <Text style={styles.boldNote}>Privacy Policy</Text>.
                </Text>
              </View>
            </View>
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
    top: -120,
    left: -60,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(255, 202, 118, 0.14)',
  },
  bottomGlow: {
    position: 'absolute',
    bottom: -100,
    right: -50,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255, 99, 138, 0.12)',
  },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 18 },
  topSection: { alignItems: 'center', marginBottom: 16 },
  backFab: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  branding: { fontSize: 28, fontWeight: '900', color: '#fff', marginTop: 10, letterSpacing: 4 },
  slogan: { color: '#fff', opacity: 0.8, fontSize: 12, marginTop: 4, fontWeight: '600' },
  card: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 32,
    paddingHorizontal: 20,
    paddingVertical: 20,
    width: '100%',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  eyebrow: { color: Colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8 },
  cardTitle: { fontSize: 22, fontWeight: '900', color: Colors.textPrimary, marginBottom: 8 },
  cardSubtitle: { fontSize: 13, color: Colors.textSecondary, marginBottom: 16, lineHeight: 19 },
  inputGroup: { marginBottom: 14 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputSurface,
    borderRadius: 16,
    marginBottom: 9,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFF0F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: { flex: 1, marginLeft: 12, color: Colors.textPrimary, fontSize: 15, fontWeight: '600' },
  eyeToggle: { padding: 10 },
  registerBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 14,
  },
  buttonDisabled: { opacity: 0.7 },
  registerBtnText: { color: '#fff', fontWeight: '900', fontSize: 15, letterSpacing: 1 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  footerInfo: { color: Colors.textSecondary, fontSize: 13 },
  loginLink: { color: Colors.primary, fontSize: 14, fontWeight: 'bold', marginLeft: 8 },
  termNote: { fontSize: 10, color: Colors.placeholder, textAlign: 'center', lineHeight: 14 },
  boldNote: { fontWeight: '700', color: Colors.textSecondary },
});

export default RegisterScreen;
