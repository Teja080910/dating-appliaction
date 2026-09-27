import React, {
  useState,
  useContext,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import {useFocusEffect} from '@react-navigation/native';
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
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppContext from '../../context/CreateGlobalStateContext';
import AttractiveLogo from '../../components/AttractiveLogo';
import {useAuth} from '../../api/useAuth';
import {useAlert} from '../../components/AlertModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  buildRegisterPayload,
  normalizeMobileNumber,
} from '../../utils/authPayload';
import {Colors, Spacing, Shadows} from '../../theme';

const RegisterScreen = ({navigation}: any) => {
  const {alert, AlertComponent} = useAlert();
  const {name, setName, password, setPassword, phoneNumber, setPhoneNumber} =
    useContext(AppContext);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const {sendRegisterOtp} = useAuth();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const subscription = Keyboard.addListener(showEvent, () => {
      // Wait for layout/viewport adjustment to complete before scrolling
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({animated: true});
      }, 100);
    });
    return () => {
      subscription.remove();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.setItem('onboardingStep', 'Register');
    }, []),
  );

  const handleRegister = async () => {
    const normalizedMobile = normalizeMobileNumber(phoneNumber);
    if (!name.trim() || !normalizedMobile || !password.trim()) {
      alert('Missing Info', 'Please fill all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      alert('Passwords Mismatch', 'Passwords do not match.');
      return;
    }
    if (normalizedMobile.length < 10) {
      alert('Invalid Number', 'Please enter a valid mobile number.');
      return;
    }

    setLoading(true);
    Keyboard.dismiss();
    try {
      const res = await sendRegisterOtp.mutateAsync(
        buildRegisterPayload({
          name,
          mobile: normalizedMobile,
          password,
          confirmPassword,
          otp: '',
        }),
      );
      setLoading(false);
      const payload = Array.isArray(res) ? res[0] || {} : res || {};
      const sessionId =
        payload?.sessionId || payload?.data?.sessionId || res?.sessionId;
      if (!sessionId) {
        alert(
          'Registration Failed',
          'Verification session could not be created.',
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
      const rawError =
        error.response?.data?.message || error.response?.data || error.message;
      alert(
        'Registration Failed',
        typeof rawError === 'object'
          ? JSON.stringify(rawError)
          : String(rawError),
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <LinearGradient
        colors={[Colors.background, Colors.surface]}
        style={styles.gradient}>
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{flex: 1}}>
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              <View style={styles.topSection}>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={styles.backFab}>
                  <Icon name="chevron-left" size={28} color={Colors.text} />
                </TouchableOpacity>
                <View style={styles.logoGlow}>
                  <AttractiveLogo size={48} />
                </View>
                <Text style={styles.branding}>AMARA</Text>
                <Text style={styles.slogan}>
                  The exclusive space for real chemistry.
                </Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.eyebrow}>GET STARTED</Text>
                <Text style={styles.cardTitle}>
                  Create Your Elegant Profile
                </Text>
                <Text style={styles.cardSubtitle}>
                  Join a community of intentional individuals seeking genuine
                  connections.
                </Text>

                <View style={styles.inputGroup}>
                  <View style={styles.inputBox}>
                    <Icon
                      name="account-outline"
                      size={20}
                      color={Colors.primary}
                    />
                    <TextInput
                      placeholder="Your Full Name"
                      style={styles.input}
                      placeholderTextColor={Colors.textMuted}
                      value={name}
                      onChangeText={setName}
                    />
                  </View>

                  <View style={styles.inputBox}>
                    <Icon
                      name="phone-outline"
                      size={20}
                      color={Colors.primary}
                    />
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
                    <Icon
                      name="lock-outline"
                      size={20}
                      color={Colors.primary}
                    />
                    <TextInput
                      placeholder="Enter Password"
                      style={styles.input}
                      placeholderTextColor={Colors.textMuted}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
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

                  <View style={styles.inputBox}>
                    <Icon
                      name="lock-check-outline"
                      size={20}
                      color={Colors.primary}
                    />
                    <TextInput
                      placeholder="Confirm Password"
                      style={styles.input}
                      placeholderTextColor={Colors.textMuted}
                      secureTextEntry={!showPassword}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.registerBtn, loading && styles.buttonDisabled]}
                  onPress={handleRegister}
                  disabled={loading}>
                  <LinearGradient
                    colors={[Colors.primary, Colors.secondary]}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.registerGradient}>
                    {loading ? (
                      <ActivityIndicator color={Colors.white} />
                    ) : (
                      <Text style={styles.registerBtnText}>CREATE ACCOUNT</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.footerRow}>
                  <Text style={styles.footerInfo}>
                    Already have an account?
                  </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.loginLink}>Login now</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.termNote}>
                  By proceeding, you agree to our{' '}
                  <Text style={styles.boldNote}>Terms of Service</Text> and{' '}
                  <Text style={styles.boldNote}>Privacy Policy</Text>.
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

const styles = StyleSheet.create({
  container: {flex: 1},
  gradient: {flex: 1},
  safeArea: {flex: 1},
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingVertical: Spacing.lg,
  },
  topSection: {alignItems: 'center', marginBottom: Spacing.xl},
  backFab: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.glass,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  logoGlow: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.glow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  branding: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.text,
    marginTop: Spacing.sm,
    letterSpacing: 4,
  },
  slogan: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: Spacing.xs,
    fontWeight: '500',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radiusXxl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    width: '100%',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    ...Shadows.xl,
  },
  eyebrow: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  cardSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 19,
  },
  inputGroup: {marginBottom: Spacing.lg},
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: Spacing.radiusMd,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    height: 52,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  input: {
    flex: 1,
    marginLeft: Spacing.md,
    color: Colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  eyeToggle: {padding: Spacing.sm},
  registerBtn: {
    borderRadius: Spacing.radiusMd,
    height: 52,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  registerGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {opacity: 0.7},
  registerBtnText: {
    color: Colors.white,
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  footerInfo: {color: Colors.textSecondary, fontSize: 13},
  loginLink: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: Spacing.sm,
  },
  termNote: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 14,
  },
  boldNote: {fontWeight: '700', color: Colors.textSecondary},
});

export default RegisterScreen;
