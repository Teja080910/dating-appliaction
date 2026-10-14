import React, {
  useCallback,
  useContext,
  useState,
  useEffect,
  useRef,
} from 'react';
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
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppContext from '../../context/CreateGlobalStateContext';
import AttractiveLogo from '../../components/AttractiveLogo';
import LanguageSelectorHeader from '../../components/LanguageSelectorHeader';
import { useAuth } from '../../api/useAuth';
import { useAlert } from '../../components/AlertModal';
import { extractSession, resolveInitialRoute } from '../../utils/session';
import {
  buildLoginPayload,
} from '../../utils/authPayload';
import { t, useTranslation } from '../../i18n';

const LoginScreen = ({ navigation }: any) => {
  useTranslation();
  const { alert, AlertComponent } = useAlert();
  const {
    setPassword: setContextPassword,
    setPhoneNumber: setContextPhoneNumber,
    setName,
    setDisplayName,
    setGender,
    setAuthUserId,
  } = useContext(AppContext);

  const [email, setEmail] = useState('sailakshmiborra45@gmail.com');
  const [password, setPassword] = useState('Password@123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const scrollRef = useRef<ScrollView>(null);

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      },
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      },
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollToInput = (yOffset: number) => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: yOffset, animated: true });
    }, 100);
  };

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.setItem('onboardingStep', 'Login');
    }, []),
  );

  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password.trim()) {
      alert('Missing Info', 'Please enter your email and password.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    Keyboard.dismiss();
    setContextPhoneNumber('');
    setContextPassword(password);
    await AsyncStorage.setItem('userEmail', cleanEmail);

    const payload = { email: cleanEmail, password };

    login.mutate(payload as any, {
      onSuccess: async (data: any) => {
        if (data?.success === false) {
          setLoading(false);
          alert('Login Failed', data?.message || t('auth.loginscreen.invalid_email_or_password'));
          return;
        }
        const session = extractSession(data);
        if (!session.token) {
          setLoading(false);
          alert('Login Error', data?.message || t('auth.loginscreen.server_did_not_return_a_valid_session'));
          return;
        }

        const user = data?.user || session.user || data?.data?.user || data?.data || {};
        const userName = user.name || user.displayName || user.username || '';
        const rawGender = String(user.gender || data?.gender || session.user?.gender || '').toLowerCase();
        const userGender =
          rawGender.includes('woman') || rawGender.includes('female')
            ? 'straight_woman'
            : 'straight_man';
        const resolvedUid = String(session.userId || user.userId || user.id || '');

        if (userName) {
          setName(userName);
          setDisplayName(userName);
        }
        if (userGender) {
          setGender(userGender);
        }
        if (resolvedUid) {
          setAuthUserId(resolvedUid);
        }

        const asyncStorageItems: [string, string][] = [
          ['isLoggedIn', 'true'],
          ['acceptedTerms', 'true'],
        ];
        if (userName) {
          asyncStorageItems.push(['name', userName], ['displayName', userName]);
        }
        if (userGender) {
          asyncStorageItems.push(['selectedGender', userGender], ['userGender', userGender]);
        }
        if (resolvedUid) {
          asyncStorageItems.push(['userId', resolvedUid], ['user_id', resolvedUid]);
        }

        setLoading(false);
        await AsyncStorage.multiSet(asyncStorageItems);
        const nextRoute = await resolveInitialRoute();
        navigation.replace(nextRoute as never);
      },
      onError: (error: any) => {
        setLoading(false);
        const status = error.response?.status;
        const serverMessage = error.response?.data?.message;
        if (serverMessage) alert('Login Failed', String(serverMessage));
        else if (status === 401 || status === 403)
          alert('Login Failed', 'Invalid credentials. Please verify your password.');
        else if (status === 404)
          alert('Account Not Found', 'No account found. Please register first.');
        else if (!error.response)
          alert('Connection Error', 'Unable to connect to server.');
        else alert('Login Failed', error.message);
      },
    });
  };

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
              ref={scrollRef}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 40 : 20 },
              ]}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
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
                  <Text style={styles.pageHeading}>{t('auth.loginscreen.log_in_to_your_account')}</Text>
                </View>

                {/* Form Input Cards */}
                <View style={styles.formContainer}>
                  {/* Email Input Card */}
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
                        onFocus={() => scrollToInput(0)}
                      />
                    </View>
                  </View>

                  {/* Password Input Card */}
                  <View style={styles.inputCard}>
                    <Text style={styles.inputLabel}>{t('auth.loginscreen.password')}</Text>
                    <View style={styles.inputFieldRow}>
                      <Icon name="lock-outline" size={20} color="#7C3AED" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="••••••••••••"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                        onFocus={() => scrollToInput(80)}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      >
                        <Icon
                          name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={21}
                          color="#9CA3AF"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Forgot Password Link */}
                  <TouchableOpacity
                    style={styles.forgotBtn}
                    onPress={() => navigation.navigate('ForgotPassword')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.forgotBtnText}>{t('auth.loginscreen.forgot_password')}</Text>
                  </TouchableOpacity>

                  {/* Primary Login Button */}
                  <TouchableOpacity
                    style={styles.loginBtn}
                    onPress={handleLogin}
                    activeOpacity={0.88}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#5B21B6" size="small" />
                    ) : (
                      <Text style={styles.loginBtnText}>{t('auth.forgotpasswordscreen.login')}</Text>
                    )}
                  </TouchableOpacity>

                  {/* Secondary 'I don't have an account' Button */}
                  <TouchableOpacity
                    style={styles.noAccountBtn}
                    onPress={() => navigation.navigate('Register')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.noAccountBtnText}>{t('auth.loginscreen.i_dont_have_an_account')}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Bottom Terms & Privacy Footer */}
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

export default LoginScreen;

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
    marginBottom: 12,
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
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 2,
    marginBottom: 18,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  forgotBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loginBtn: {
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
  loginBtnText: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#5B21B6',
    letterSpacing: 0.3,
  },
  noAccountBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  noAccountBtnText: {
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
});
