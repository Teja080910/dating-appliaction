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
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppContext from '../../context/CreateGlobalStateContext';
import AttractiveLogo from '../../components/AttractiveLogo';
import LanguageSelectorHeader from '../../components/LanguageSelectorHeader';
import { useAuth } from '../../api/useAuth';
import apiClient from '../../api/apiClient';
import { useAlert } from '../../components/AlertModal';
import { extractSession, resolveInitialRoute, clearFullSession } from '../../utils/session';
import {
  isAccountPendingDeletion,
  removeDeletedAccountLocally,
  getPendingDeletionUserIdByEmail,
} from '../../utils/types/AsyncStorage';
import { t, useTranslation } from '../../i18n';
import { mockStore } from '../../mock/mockStore';
import { USE_MOCK } from '../../environment/ApiConfig';

const LoginScreen = ({ navigation, route }: any) => {
  useTranslation();
  const { alert, AlertComponent } = useAlert();
  const {
    setPassword: setContextPassword,
    setPhoneNumber: setContextPhoneNumber,
    setName,
    setDisplayName,
    setGender,
    setAuthUserId,
    setIsSubscribed,
    setImages,
    setProfileImage,
    setProfileImageUrl,
  } = useContext(AppContext);

  const [email, setEmail] = useState(route?.params?.email ? String(route.params.email).trim() : '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { login, activateAccount } = useAuth();
  const scrollRef = useRef<ScrollView>(null);

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
  const cleanEmail = email.trim();
  const isEmailFormatValid = cleanEmail.length > 0 && EMAIL_REGEX.test(cleanEmail);
  const showEmailError =
    (cleanEmail.length > 0 && !isEmailFormatValid) ||
    (submitted && !isEmailFormatValid);

  const isPasswordLengthValid = password.length >= 6;
  const showPasswordError =
    (password.length > 0 && !isPasswordLengthValid) ||
    (submitted && !isPasswordLengthValid);

  // Floating bottom error toast states and animations
  const [errorMessage, setErrorMessage] = useState('');
  const [errorToastVisible, setErrorToastVisible] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslateY = useRef(new Animated.Value(20)).current;
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showError = (msg: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setErrorMessage(msg);
    setErrorToastVisible(true);
    toastOpacity.setValue(0);
    toastTranslateY.setValue(20);

    Animated.parallel([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(toastTranslateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Automatically dismiss after 2.8 seconds
    toastTimerRef.current = setTimeout(() => {
      dismissErrorToast();
    }, 2800);
  };

  const dismissErrorToast = () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    Animated.parallel([
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(toastTranslateY, {
        toValue: 20,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Guaranteed unmount fallback
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      setErrorToastVisible(false);
      setErrorMessage('');
    }, 220);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (route?.params?.email) {
      setEmail(String(route.params.email).trim());
    }
  }, [route?.params?.email]);

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
    setSubmitted(true);
    const cleanLowerEmail = email.trim().toLowerCase();
    const isEmailValid = cleanLowerEmail.length > 0 && EMAIL_REGEX.test(cleanLowerEmail);
    const isPasswordValid = password.length >= 6;

    if (!isEmailValid || !isPasswordValid) {
      showError(t('auth.loginscreen.invalid_email_or_password') || 'Invalid email or password');
      return;
    }

    setLoading(true);
    Keyboard.dismiss();
    setContextPhoneNumber('');
    setContextPassword(password);
    await AsyncStorage.setItem('userEmail', cleanLowerEmail);

    const payload = { email: cleanLowerEmail, password };

    login.mutate(payload as any, {
      onSuccess: async (data: any) => {
        if (data?.success === false) {
          setLoading(false);
          showError(data?.message || t('auth.loginscreen.invalid_email_or_password') || 'Invalid email or password');
          return;
        }
        const session = extractSession(data);
        if (!session.token) {
          setLoading(false);
          showError(data?.message || t('auth.loginscreen.invalid_email_or_password') || 'Invalid email or password');
          return;
        }

        const user = data?.user || session.user || data?.data?.user || data?.data || {};
        const userName = user.name || user.displayName || user.username || '';

        const profileObj = user?.profile || data?.profile || session.user?.profile || data?.data?.profile;
        const profileGender = String(profileObj?.gender || profileObj?.userGender || '').toLowerCase();
        const userGenderField = String(user.gender || data?.gender || session.user?.gender || '').toLowerCase();

        let userGender = '';
        if (profileGender.includes('woman') || profileGender.includes('female')) {
          userGender = 'straight_woman';
        } else if (userGenderField.includes('woman') || userGenderField.includes('female')) {
          userGender = 'straight_woman';
        } else if (profileGender.includes('man') || profileGender.includes('male')) {
          userGender = 'straight_man';
        } else if (userGenderField.includes('man') || userGenderField.includes('male')) {
          userGender = 'straight_man';
        }

        const resolvedUid = String(session.userId || user.userId || user.id || '');

        const proceedWithLogin = async () => {
          // Immediately resolve actual gender from backend profile
          if (resolvedUid) {
            try {
              const profRes = await apiClient
                .get(`/profile/me/${resolvedUid}`)
                .catch(() => apiClient.post('/profile/me', null, { params: { userId: resolvedUid } }))
                .catch(() => apiClient.get('/profile/me', { params: { userId: resolvedUid } }))
                .catch(() => apiClient.post('/profile/me', { userId: resolvedUid }))
                .catch(() => apiClient.get(`/profile/get/${resolvedUid}`))
                .catch(() => apiClient.get('/profile/get', { params: { userId: resolvedUid } }))
                .catch(() => apiClient.get(`/users/${resolvedUid}`))
                .catch(() => null);
              const liveData = profRes?.data?.data || profRes?.data || {};
              const liveGender = String(
                liveData?.gender ||
                liveData?.profile?.gender ||
                liveData?.user?.gender ||
                liveData?.orientation ||
                ''
              ).toLowerCase();
              if (liveGender) {
                if (liveGender.includes('woman') || liveGender.includes('female')) {
                  userGender = 'straight_woman';
                } else if (liveGender.includes('man') || liveGender.includes('male')) {
                  userGender = 'straight_man';
                }
              }
            } catch {}
          }

          // If still unresolved, check user-scoped storage
          if (!userGender && resolvedUid) {
            const scopedGender = await AsyncStorage.getItem(`user_gender_${resolvedUid}`).catch(() => null);
            if (scopedGender) userGender = scopedGender;
          }

          // Check email hints if gender is still not determined
          if (!userGender) {
            const lowerEmail = cleanEmail.toLowerCase();
            if (
              lowerEmail.includes('woman') ||
              lowerEmail.includes('female') ||
              lowerEmail.includes('priya') ||
              lowerEmail.includes('ananya')
            ) {
              userGender = 'straight_woman';
            } else if (
              lowerEmail.includes('man') ||
              lowerEmail.includes('male') ||
              lowerEmail.includes('kumar') ||
              lowerEmail.includes('rahul')
            ) {
              userGender = 'straight_man';
            }
          }

          if (!userGender) {
            const prev = (await AsyncStorage.getItem('userGender')) || (await AsyncStorage.getItem('selectedGender'));
            userGender = prev || 'straight_woman';
          }

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
          setImages?.([null, null, null, null, null, null]);
          setProfileImage?.(null);
          setProfileImageUrl?.(null);

          const asyncStorageItems: [string, string][] = [
            ['isLoggedIn', 'true'],
            ['acceptedTerms', 'true'],
          ];
          if (userName) {
            asyncStorageItems.push(['name', userName], ['displayName', userName]);
          }
          if (userGender) {
            asyncStorageItems.push(['selectedGender', userGender], ['userGender', userGender]);
            if (resolvedUid) {
              asyncStorageItems.push([`user_gender_${resolvedUid}`, userGender]);
            }
          }
          if (resolvedUid) {
            asyncStorageItems.push(['userId', resolvedUid], ['user_id', resolvedUid]);
          }

          // Check subscription status from server response, backend endpoint, mockStore, or storage
          try {
            let backendSubActive = false;
            let backendPlan = user.plan || 'STANDARD';
            let backendEndDate = null;

            if (resolvedUid) {
              try {
                const res = await apiClient.get('/subscriber/status', {
                  params: { userId: resolvedUid },
                  headers: session?.token ? { Authorization: `Bearer ${session.token}` } : undefined,
                });
                const d = res.data;
                if (d?.active || d?.isActive || d?.status === 'ACTIVE') {
                  backendSubActive = true;
                  backendPlan = d.plan || d.planType || 'STANDARD';
                  backendEndDate = d.endDate || null;
                }
              } catch {}
            }

            const sub = USE_MOCK && resolvedUid ? await mockStore.getSubscriptionStatus(resolvedUid).catch(() => null) : null;
            const hasActiveSub = Boolean(
              user.isSubscribed ||
              user.subscription?.isActive ||
              user.subscriptionStatus === 'active' ||
              backendSubActive ||
              (sub && sub.status === 'ACTIVE')
            );
            if (hasActiveSub) {
              const planToSave = backendPlan || sub?.plan || 'STANDARD';
              asyncStorageItems.push(
                ['isSubscribed', 'true'],
                [`isSubscribed_${resolvedUid}`, 'true'],
                ['@subscription_plan', planToSave],
                [`@subscription_plan_${resolvedUid}`, planToSave]
              );
              if (backendEndDate || sub?.endDate) {
                const endVal = String(backendEndDate || sub?.endDate);
                asyncStorageItems.push(
                  ['@subscription_endDate', endVal],
                  [`@subscription_endDate_${resolvedUid}`, endVal]
                );
              }
              setIsSubscribed?.(true);
            } else {
              setIsSubscribed?.(false);
              await AsyncStorage.multiRemove([
                'isSubscribed',
                '@subscription_plan',
                '@subscription_endDate',
                '@subscription_remainingDays',
                `isSubscribed_${resolvedUid}`,
                `@subscription_plan_${resolvedUid}`,
                `@subscription_endDate_${resolvedUid}`,
              ]).catch(() => {});
            }
          } catch {}

          setLoading(false);
          await AsyncStorage.multiSet(asyncStorageItems);
          const nextRoute = await resolveInitialRoute();
          navigation.replace(nextRoute as never);
        };

        const isLocallyPending =
          (await isAccountPendingDeletion(resolvedUid)) ||
          (await isAccountPendingDeletion(await getPendingDeletionUserIdByEmail(cleanEmail)));

        const isServerPending = Boolean(
          data?.pendingDeletion === true ||
          data?.status === 'PENDING_DELETION' ||
          user?.isDeactivated === true ||
          user?.status === 'PENDING_DELETION' ||
          user?.isActive === false
        );

        // Option B: Automatically restore the account upon successful login
        if (isLocallyPending || isServerPending) {
          try {
            const targetId = resolvedUid || (await getPendingDeletionUserIdByEmail(cleanEmail));
            if (targetId) {
              await activateAccount.mutateAsync(targetId).catch(() => null);
              await removeDeletedAccountLocally(targetId, cleanEmail);
            }
          } catch (autoRestoreErr) {
            console.warn('[Login] Auto-restore error:', autoRestoreErr);
          }
        }

        await proceedWithLogin();
      },
      onError: async (error: any) => {
        setLoading(false);
        const serverMessage = String(error?.response?.data?.message || error?.message || '');
        const lowerMsg = serverMessage.toLowerCase();
        const isDeactivatedError =
          lowerMsg.includes('deactivated') ||
          lowerMsg.includes('pending deletion') ||
          lowerMsg.includes('scheduled for deletion');

        // Option B: If login was blocked due to deactivation, automatically activate and retry
        if (isDeactivatedError) {
          const pendingUid = await getPendingDeletionUserIdByEmail(cleanEmail);
          if (pendingUid) {
            try {
              setLoading(true);
              await activateAccount.mutateAsync(pendingUid);
              await removeDeletedAccountLocally(pendingUid, cleanEmail);
              handleLogin();
              return;
            } catch (actErr: any) {
              setLoading(false);
              showError(
                actErr?.response?.data?.message ||
                actErr?.message ||
                'Account was scheduled for deletion. Failed to automatically restore.'
              );
              return;
            }
          }
        }

        const status = error.response?.status;
        if (status === 401 || status === 403) {
          showError(t('auth.loginscreen.invalid_email_or_password') || 'Invalid email or password');
        } else if (serverMessage) {
          showError(String(serverMessage));
        } else if (status === 404) {
          showError(t('auth.loginscreen.no_account_found_please_register_first') || 'No account found. Please register first.');
        } else if (!error.response) {
          showError(t('auth.loginscreen.unable_to_connect_to_server') || 'Unable to connect to server');
        } else {
          showError(error.message || t('auth.loginscreen.invalid_email_or_password') || 'Invalid email or password');
        }
      },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={['#180B2B', '#2E1065', '#581C87', '#7C3AED', '#3B0764']}
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
                { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 40 : 24 },
              ]}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
            >
              {/* Top Language Dropdown (clean, centered without heavy pill box as in Glambu) */}
              <View style={styles.topLangRow}>
                <LanguageSelectorHeader color="#FFFFFF" />
              </View>

              {/* Main Content Area (Brand + Form unified) */}
              <View style={styles.mainContent}>
                {/* Official Amara Brand Title */}
                <View style={styles.brandContainer}>
                  <Text style={styles.brandTitle}>{t('home.homeheader.amara')}</Text>
                  <Text style={styles.pageHeading}>{t('auth.loginscreen.log_in_to_your_account')}</Text>
                </View>

                {/* Form Input Cards */}
                <View style={styles.formContainer}>
                  {/* Email Input Card */}
                  <View style={[styles.inputCard, showEmailError && styles.inputCardWithError]}>
                    <Text style={styles.inputLabel}>{t('auth.forgotpasswordscreen.email')}</Text>
                    <View style={styles.inputFieldRow}>
                      <Icon name="email-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="your.email@example.com"
                        placeholderTextColor="#9CA3AF"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={(val) => {
                          setEmail(val);
                          if (errorToastVisible) dismissErrorToast();
                        }}
                        onFocus={() => scrollToInput(0)}
                      />
                    </View>
                  </View>
                  {showEmailError && (
                    <Text style={styles.validationErrorText}>
                      {t('auth.loginscreen.invalid_email_address', { defaultValue: 'Invalid email address' })}
                    </Text>
                  )}

                  {/* Password Input Card */}
                  <View style={[styles.inputCard, showPasswordError && styles.inputCardWithError]}>
                    <Text style={styles.inputLabel}>{t('auth.loginscreen.password')}</Text>
                    <View style={styles.inputFieldRow}>
                      <Icon name="lock-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="••••••••••••"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={(val) => {
                          setPassword(val);
                          if (errorToastVisible) dismissErrorToast();
                        }}
                        onFocus={() => scrollToInput(80)}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      >
                        <Icon
                          name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                          size={22}
                          color="#8E8E93"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {showPasswordError && (
                    <Text style={styles.validationErrorText}>
                      {t('auth.loginscreen.password_min_length', { defaultValue: 'Password must be at least 6 characters long' })}
                    </Text>
                  )}

                  {/* Forgot Password Link */}
                  <TouchableOpacity
                    style={styles.forgotBtn}
                    onPress={() => navigation.navigate('ForgotPassword')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.forgotBtnText}>{t('auth.loginscreen.forgot_password')}</Text>
                  </TouchableOpacity>

                  {/* Primary Login Button (White Pill Button as in Glambu) */}
                  <TouchableOpacity
                    style={styles.loginBtn}
                    onPress={handleLogin}
                    activeOpacity={0.88}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#111827" size="small" />
                    ) : (
                      <Text style={styles.loginBtnText}>{t('auth.forgotpasswordscreen.login')}</Text>
                    )}
                  </TouchableOpacity>

                  {/* Secondary 'I don't have an account' Button (Translucent Pill Button) */}
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

      {/* Floating Bottom Error Message Banner (centered in middle of app bottom) */}
      {errorToastVisible && (
        <Animated.View
          style={[
            styles.errorToastContainer,
            {
              opacity: toastOpacity,
              transform: [{ translateY: toastTranslateY }],
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={dismissErrorToast}
            style={styles.errorToastInner}
          >
            <View style={styles.toastLogoWrap}>
              <AttractiveLogo size={26} />
            </View>
            <Text style={styles.errorToastText} numberOfLines={2}>
              {errorMessage}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

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
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  topLangRow: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 8,
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 32,
  },
  brandTitle: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  pageHeading: {
    fontSize: 21,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 14,
  },
  inputCardWithError: {
    marginBottom: 6,
  },
  validationErrorText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '400',
    marginTop: -2,
    marginBottom: 12,
    marginLeft: 18,
    letterSpacing: 0.2,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: 0.2,
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
    fontWeight: '400',
    color: '#111827',
    paddingVertical: Platform.OS === 'android' ? 2 : 4,
    paddingHorizontal: 0,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 4,
    marginBottom: 22,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  forgotBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  loginBtn: {
    backgroundColor: '#FFFFFF',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnText: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.2,
  },
  noAccountBtn: {
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  noAccountBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 6,
    paddingHorizontal: 16,
  },
  termsText: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    lineHeight: 18,
  },
  underlineLink: {
    textDecorationLine: 'underline',
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Floating Error Message Banner (centered in middle of app bottom)
  errorToastContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 54 : 66,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  errorToastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#160E1A',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    maxWidth: '90%',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    elevation: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
  },
  toastLogoWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  errorToastIconBox: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorToastText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: 0.1,
    lineHeight: 19,
    textAlign: 'center',
    flexShrink: 1,
  },
});
