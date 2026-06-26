import React, { useCallback, useContext, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppContext from '../../context/CreateGlobalStateContext';
import AttractiveLogo from '../../components/AttractiveLogo';
import { useAuth } from '../../api/useAuth';
import { useAlert } from '../../components/AlertModal';
import { extractSession, resolveInitialRoute } from '../../utils/session';
import { buildLoginPayload, normalizeMobileNumber } from '../../utils/authPayload';
import { Colors, Spacing, Shadows, Typography } from '../../theme';

const LoginScreen = ({ navigation }: any) => {
  const { alert, AlertComponent } = useAlert();
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
      alert('Missing Info', 'Please enter mobile number and password.');
      return;
    }
    if (normalizedMobile.length < 10) {
      alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    const payload = buildLoginPayload(normalizedMobile, password);

    login.mutate(payload, {
      onSuccess: async (data: any) => {
        if (data?.success === false) {
          setLoading(false);
          alert('Login Failed', data?.message || 'Invalid mobile number or password.');
          return;
        }
        const session = extractSession(data);
        if (!session.token) {
          setLoading(false);
          alert('Login Error', data?.message || 'Server did not return a valid session.');
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
        if (serverMessage) alert('Login Failed', String(serverMessage));
        else if (status === 401 || status === 403) alert('Login Failed', 'Invalid mobile number or password.');
        else if (status === 404) alert('Account Not Found', 'No account found. Please register first.');
        else if (!error.response) alert('Connection Error', 'Unable to connect to server.');
        else alert('Login Failed', error.message);
      },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={[Colors.background, '#1A1530', Colors.surface]} style={styles.gradient}>
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.topSection}>
                <View style={styles.logoGlow}>
                  <AttractiveLogo size={56} />
                </View>
                <Text style={styles.branding}>AMARA</Text>
                <Text style={styles.slogan}>Private chemistry, beautifully designed.</Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.eyebrow}>WELCOME BACK</Text>
                <Text style={styles.cardTitle}>Sign in to your private circle</Text>
                <Text style={styles.cardSubtitle}>Verified members, elegant profiles, and a more intentional dating experience.</Text>

                <View style={styles.inputGroup}>
                  <View style={styles.inputBox}>
                    <Icon name="phone-outline" size={20} color={Colors.primary} />
                    <TextInput
                      placeholder="Mobile Number"
                      style={styles.input}
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="number-pad"
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                    />
                  </View>

                  <View style={styles.inputBox}>
                    <Icon name="lock-outline" size={20} color={Colors.primary} />
                    <TextInput
                      placeholder="Your Password"
                      style={styles.input}
                      placeholderTextColor={Colors.textMuted}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeToggle}>
                      <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.loginBtn, loading && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={[Colors.primary, Colors.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.loginGradient}
                  >
                    {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.loginBtnText}>LOGIN</Text>}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.divider}>
                  <View style={styles.line} />
                  <Text style={styles.orText}>OR</Text>
                  <View style={styles.line} />
                </View>

                <TouchableOpacity style={styles.registerBtn} onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.registerBtnText}>CREATE ACCOUNT</Text>
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
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.screenPaddingHorizontal, paddingVertical: Spacing.lg },
  topSection: { alignItems: 'center', marginBottom: Spacing.xxl },
  logoGlow: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.glow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  branding: { fontSize: 32, fontWeight: '900', color: Colors.text, marginTop: Spacing.sm, letterSpacing: 5 },
  slogan: { color: Colors.textSecondary, fontSize: 13, marginTop: Spacing.xs, fontWeight: '500', letterSpacing: 0.4 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radiusXxl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    width: '100%',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    ...Shadows.xl,
  },
  eyebrow: { color: Colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: Spacing.sm },
  cardTitle: { fontSize: 22, fontWeight: '900', color: Colors.text, marginBottom: Spacing.sm, lineHeight: 28 },
  cardSubtitle: { fontSize: 13, color: Colors.textSecondary, marginBottom: Spacing.lg, lineHeight: 20 },
  inputGroup: { marginBottom: Spacing.lg },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: Spacing.radiusMd,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    height: 54,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  input: { flex: 1, marginLeft: Spacing.md, color: Colors.text, fontSize: 16, fontWeight: '500' },
  eyeToggle: { padding: Spacing.sm },
  loginBtn: {
    borderRadius: Spacing.radiusMd,
    height: 54,
    overflow: 'hidden',
    ...Shadows.md,
  },
  loginGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  loginBtnText: { color: Colors.white, fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.lg },
  line: { flex: 1, height: 1, backgroundColor: Colors.divider },
  orText: { marginHorizontal: Spacing.lg, fontSize: 11, fontWeight: '800', color: Colors.textMuted },
  registerBtn: {
    height: 54,
    borderRadius: Spacing.radiusMd,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.06)',
  },
  registerBtnText: { color: Colors.primary, fontWeight: '900', fontSize: 14, letterSpacing: 1 },
});

export default LoginScreen;
