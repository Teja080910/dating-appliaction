import React, { useContext, useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { extractSession, resolveInitialRoute } from '../../utils/session';
import { buildLoginPayload, normalizeMobileNumber } from '../../utils/authPayload';

const LoginScreen = ({ navigation }: any) => {
  const { password, setPassword, phoneNumber, setPhoneNumber } = useContext(AppContext);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.setItem('onboardingStep', 'Login');
    }, [])
  );

  const handleLogin = async () => {
    const normalizedMobile = normalizeMobileNumber(phoneNumber);

    if (!normalizedMobile || !password.trim()) {
      Alert.alert('Missing Info', 'Please enter mobile number and password.');
      return;
    }

    if (normalizedMobile.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    const payload = buildLoginPayload(normalizedMobile, password);

    if (__DEV__) {
      console.log('📤 [LOGIN] Sending payload:', JSON.stringify(payload));
    }

    login.mutate(payload, {
      onSuccess: async (data: any) => {
        if (__DEV__) {
          console.log('📥 [LOGIN] Raw response:', JSON.stringify(data, null, 2));
        }

        // Check if backend explicitly said login failed
        if (data?.success === false) {
          setLoading(false);
          Alert.alert(
            'Login Failed',
            data?.message || 'Invalid mobile number or password. Please try again.',
          );
          return;
        }

        const session = extractSession(data);
        if (__DEV__) {
          console.log('🔑 [LOGIN] Extracted session:', {
            hasToken: Boolean(session.token),
            userId: session.userId,
            tokenPreview: session.token ? session.token.substring(0, 20) + '...' : 'null',
          });
        }

        if (!session.token) {
          setLoading(false);
          const backendMessage =
            data?.message ||
            data?.data?.message ||
            'Server did not return a valid session. Please contact support.';

          Alert.alert('Login Error', String(backendMessage));
          return;
        }

        setLoading(false);
        const nextRoute = await resolveInitialRoute();
        navigation.replace(nextRoute);
      },
      onError: (error: any) => {
        setLoading(false);
        const status = error.response?.status;
        const serverMessage = error.response?.data?.message;
        const serverData = error.response?.data;

        if (__DEV__) {
          console.log('❌ [LOGIN] Error:', { status, serverMessage, serverData: JSON.stringify(serverData) });
        }

        // Show specific messages based on what the server returns
        if (serverMessage) {
          Alert.alert('Login Failed', String(serverMessage));
        } else if (status === 401 || status === 403) {
          Alert.alert('Login Failed', 'Invalid mobile number or password. Please try again.');
        } else if (status === 404) {
          Alert.alert('Account Not Found', 'No account found with this mobile number. Please register first.');
        } else if (!error.response) {
          Alert.alert('Connection Error', 'Unable to connect to server. Please check your internet connection and try again.');
        } else {
          const rawError = serverData || error.message;
          Alert.alert('Login Failed', typeof rawError === 'object' ? JSON.stringify(rawError) : String(rawError));
        }
      },
    });
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
                <AttractiveLogo />
                <Text style={styles.branding}>AMARA</Text>
                <Text style={styles.slogan}>Private chemistry, beautifully designed.</Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.eyebrow}>WELCOME BACK</Text>
                <Text style={styles.cardTitle}>Sign in to your private circle</Text>
                <Text style={styles.cardSubtitle}>Verified members, elegant profiles, and a more intentional dating experience.</Text>

                <View style={styles.inputGroup}>
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
                      placeholder="Your Password"
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
                </View>

                <TouchableOpacity style={[styles.loginBtn, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>LOGIN</Text>}
                </TouchableOpacity>

                <View style={styles.trustRow}>
                  <View style={styles.trustItem}>
                    <Icon name="shield-check-outline" size={15} color={Colors.textSecondary} />
                    <Text style={styles.trustText}>Private</Text>
                  </View>
                  <View style={styles.trustItem}>
                    <Icon name="sparkles-outline" size={15} color={Colors.textSecondary} />
                    <Text style={styles.trustText}>Curated</Text>
                  </View>
                  <View style={styles.trustItem}>
                    <Icon name="heart-outline" size={15} color={Colors.textSecondary} />
                    <Text style={styles.trustText}>Elegant</Text>
                  </View>
                </View>

                <View style={styles.divider}>
                  <View style={styles.line} />
                  <Text style={styles.orText}>OR</Text>
                  <View style={styles.line} />
                </View>

                <TouchableOpacity style={styles.registerBtn} onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.registerBtnText}>CREATE ACCOUNT</Text>
                </TouchableOpacity>
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
    top: -100,
    right: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 90, 121, 0.12)',
  },
  bottomGlow: {
    position: 'absolute',
    bottom: -80,
    left: -40,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255, 142, 83, 0.1)',
  },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 18 },
  topSection: { alignItems: 'center', marginBottom: 16 },
  branding: { fontSize: 30, fontWeight: '900', color: '#fff', marginTop: 10, letterSpacing: 5 },
  slogan: { color: '#fff', opacity: 0.8, fontSize: 12, marginTop: 4, fontWeight: '600', letterSpacing: 0.4 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 32,
    paddingHorizontal: 22,
    paddingVertical: 22,
    width: '100%',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  eyebrow: { color: Colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8, textAlign: 'left' },
  cardTitle: { fontSize: 24, fontWeight: '900', color: Colors.textPrimary, marginBottom: 8, lineHeight: 30 },
  cardSubtitle: { fontSize: 13, color: Colors.textSecondary, marginBottom: 18, lineHeight: 20, opacity: 0.8 },
  inputGroup: { marginBottom: 16 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputSurface,
    borderRadius: 16,
    marginBottom: 10,
    paddingHorizontal: 16,
    height: 54,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFF0F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: { flex: 1, marginLeft: 12, color: Colors.textPrimary, fontSize: 16, fontWeight: '600' },
  eyeToggle: { padding: 10 },
  loginBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  loginBtnText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  trustRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingHorizontal: 4 },
  trustItem: { flexDirection: 'row', alignItems: 'center' },
  trustText: { fontSize: 12, color: Colors.textSecondary, marginLeft: 6, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 18 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(0,0,0,0.06)' },
  orText: { marginHorizontal: 15, fontSize: 11, fontWeight: '800', color: '#BBB' },
  registerBtn: {
    height: 58,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 90, 121, 0.04)',
  },
  registerBtnText: { color: Colors.primary, fontWeight: '900', fontSize: 14, letterSpacing: 1 },
});

export default LoginScreen;
