import React, {
  useState,
  useContext,
  useCallback,
  useEffect,
  useRef,
} from 'react';
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
import AppContext from '../../context/CreateGlobalStateContext';
import AttractiveLogo from '../../components/AttractiveLogo';
import LanguageSelectorHeader from '../../components/LanguageSelectorHeader';
import { useAuth } from '../../api/useAuth';
import { useAlert } from '../../components/AlertModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  buildRegisterPayload,
  normalizeMobileNumber,
} from '../../utils/authPayload';
import { t, useTranslation } from '../../i18n';

const RegisterScreen = ({ navigation }: any) => {
  useTranslation();
  const { alert, AlertComponent } = useAlert();
  const {
    setName: setContextName,
    setDisplayName,
    setPassword: setContextPassword,
    setPhoneNumber: setContextPhoneNumber,
    setGender,
    setDate,
    setHeight,
    setSelectedAppearance,
    setSelectedBodyType,
    setSelectedLanguages,
    setSelectedEthinicity,
    setSelectedSmoking,
    setSelectedDrinking,
    setSelectedLookingFor,
    setEnglishSkillLevel,
    setProfileText,
    setImages,
  } = useContext(AppContext);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { sendRegisterOtp } = useAuth();
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
      AsyncStorage.setItem('onboardingStep', 'Register');

      setName('');
      setContextName('');
      setDisplayName('');
      setPassword('');
      setContextPassword('');
      setEmail('');
      setContextPhoneNumber('');
      setGender(null);
      setDate(new Date(2004, 9, 7));
      setHeight(165);
      setSelectedAppearance(null);
      setSelectedBodyType(null);
      setSelectedLanguages([]);
      setSelectedEthinicity(null);
      setSelectedSmoking(null);
      setSelectedDrinking(null);
      setSelectedLookingFor([]);
      setEnglishSkillLevel(0);
      setProfileText('');
      setImages(Array(6).fill(null));
      AsyncStorage.multiRemove([
        'name',
        'displayName',
        'userName',
        'password',
        'phoneNumber',
        'userEmail',
        'profileImage',
        'onboardingImages',
        'registerSessionId',
        '@amara_mock_images',
        '@onboarding_bio',
        '@amara_kid_count',
        '@amara_net_worth',
        '@selfie_verified',
      ]);
    }, [
      setDate,
      setDisplayName,
      setEnglishSkillLevel,
      setGender,
      setHeight,
      setImages,
      setName,
      setPassword,
      setContextPhoneNumber,
      setProfileText,
      setSelectedAppearance,
      setSelectedBodyType,
      setSelectedDrinking,
      setSelectedEthinicity,
      setSelectedLanguages,
      setSelectedLookingFor,
      setSelectedSmoking,
    ]),
  );

  const handleRegister = async () => {
    const cleanEmail = email.trim();
    if (!name.trim() || !cleanEmail || !password.trim()) {
      alert('Missing Info', 'Please fill all required fields.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (password !== confirmPassword) {
      alert('Passwords Mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    Keyboard.dismiss();
    setContextName(name.trim());
    setDisplayName(name.trim());
    setContextPhoneNumber('');
    setContextPassword(password);
    await AsyncStorage.setItem('userEmail', cleanEmail);

    try {
      const res = await sendRegisterOtp.mutateAsync(
        buildRegisterPayload({
          name: name.trim(),
          email: cleanEmail,
          password,
          confirmPassword,
          otp: '',
        }),
      );
      setLoading(false);
      const payload = Array.isArray(res) ? res[0] || {} : res || {};
      const sessionId = payload?.sessionId || payload?.data?.sessionId || res?.sessionId || 'sess_mock';
      await AsyncStorage.setItem('registerSessionId', String(sessionId).trim());
      navigation.navigate('OTPScreen', {
        email: cleanEmail,
        name: name.trim(),
        password: password.trim(),
        confirmPassword: confirmPassword.trim(),
        sessionId: sessionId || null,
      });
    } catch (error: any) {
      setLoading(false);
      navigation.navigate('OTPScreen', {
        email: cleanEmail,
        name: name.trim(),
        password: password.trim(),
        confirmPassword: confirmPassword.trim(),
        sessionId: 'sess_mock',
      });
    }
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
                    <AttractiveLogo size={68} />
                  </View>
                  <Text style={styles.brandTitle}>{t('home.homeheader.amara')}</Text>
                  <Text style={styles.pageHeading}>{t('auth.registerscreen.create_your_account')}</Text>
                </View>

                {/* Form Input Cards */}
                <View style={styles.formContainer}>
                  {/* Full Name Card */}
                  <View style={styles.inputCard}>
                    <Text style={styles.inputLabel}>{t('auth.registerscreen.name')}</Text>
                    <View style={styles.inputFieldRow}>
                      <Icon name="account-outline" size={20} color="#7C3AED" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder={t('auth.registerscreen.your_full_name')}
                        placeholderTextColor="#9CA3AF"
                        value={name}
                        onChangeText={setName}
                        onFocus={() => scrollToInput(0)}
                      />
                    </View>
                  </View>

                  {/* Email Input Card */}
                  <View style={styles.inputCard}>
                    <Text style={styles.inputLabel}>{t('auth.forgotpasswordscreen.email')}</Text>
                    <View style={styles.inputFieldRow}>
                      <Icon name="email-outline" size={20} color="#7C3AED" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="your.email@example.com"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                        onFocus={() => scrollToInput(50)}
                      />
                    </View>
                  </View>

                  {/* Password Card */}
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
                        onFocus={() => scrollToInput(140)}
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

                  {/* Confirm Password Card */}
                  <View style={styles.inputCard}>
                    <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
                    <View style={styles.inputFieldRow}>
                      <Icon name="lock-check-outline" size={20} color="#7C3AED" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="••••••••••••"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry={!showConfirmPassword}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        onFocus={() => scrollToInput(210)}
                      />
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      >
                        <Icon
                          name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={21}
                          color="#9CA3AF"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Create Account Primary Button */}
                  <TouchableOpacity
                    style={styles.registerBtn}
                    onPress={handleRegister}
                    activeOpacity={0.88}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#5B21B6" size="small" />
                    ) : (
                      <Text style={styles.registerBtnText}>{t('auth.registerscreen.create_account')}</Text>
                    )}
                  </TouchableOpacity>

                  {/* Already have an account secondary button */}
                  <TouchableOpacity
                    style={styles.hasAccountBtn}
                    onPress={() => navigation.navigate('Login')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.hasAccountBtnText}>{t('auth.registerscreen.already_have_an_account_log_in')}</Text>
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

export default RegisterScreen;

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
    marginBottom: 20,
  },
  logoHaloWrap: {
    marginBottom: 6,
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
    paddingVertical: 9,
    marginBottom: 10,
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
  registerBtn: {
    backgroundColor: '#FFFFFF',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  registerBtnText: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#5B21B6',
    letterSpacing: 0.3,
  },
  hasAccountBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  hasAccountBtnText: {
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
