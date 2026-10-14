import React, { useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
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
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Spacing, Shadows, useTheme } from '../../theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../api/useAuth';
import { useAlert } from '../../components/AlertModal';
import { clearOnboardingState, STORAGE_KEYS, markTermsAccepted } from '../../utils/sessionState';
import { usePrivacy } from '../../api/usePrivacy';
import { AsyncStorageService } from '../../utils/types/AsyncStorage';
import { mockStore } from '../../mock/mockStore';
import { buildRegisterPayload, normalizeMobileNumber } from '../../utils/authPayload';
import { t, useTranslation } from '../../i18n';

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
  useTranslation();
  const { alert, AlertComponent } = useAlert();
  const { themeColors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const { phone, mobile, email, name, password, confirmPassword, sessionId } = route.params || {};
  const recipient = String(email || mobile || phone || '').trim();
  const isEmail = recipient.includes('@') || Boolean(email);
  const normalizedMobile = isEmail ? '' : normalizeMobileNumber(recipient);
  
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(true);
  const [registerSessionId, setRegisterSessionId] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const timerId = setTimeout(() => {
      inputRef.current?.focus();
    }, 250);
    return () => clearTimeout(timerId);
  }, []);

  const otpArray = useMemo(() => {
    const arr = Array(6).fill('');
    for (let i = 0; i < 6; i++) {
      if (otp[i]) arr[i] = otp[i];
    }
    return arr;
  }, [otp]);

  useEffect(() => {
    const initId = typeof sessionId === 'string' && sessionId.trim() ? sessionId.trim() : null;
    if (initId) {
      setRegisterSessionId(initId);
    }
  }, [sessionId]);

  const {
    name: contextName,
    setName,
    setDisplayName,
    password: contextPassword,
    phoneNumber: contextPhoneNumber,
    setImages,
    setProfileImage,
    setProfileImageUrl,
    setInitialScreen,
    setProfileText,
    setSelectedAppearance,
    setSelectedBodyType,
    setSelectedLanguages,
    setSelectedEthinicity,
    setSelectedSmoking,
    setSelectedDrinking,
    setSelectedLookingFor,
    setSelectedKids,
    setSelectedNetWorth,
    setEnglishSkillLevel,
  } = useContext(AppContext);

  const { sendRegisterOtp, verifyRegisterOtp } = useAuth();
  const { acceptTerms } = usePrivacy();

  const effectiveName = String(name ?? contextName ?? '').trim();
  const effectivePassword = String(password ?? contextPassword ?? '').trim();
  const effectiveConfirmPassword = String(confirmPassword ?? effectivePassword).trim();
  const effectiveMobile = isEmail ? '' : normalizeMobileNumber(recipient || contextPhoneNumber);

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
        email: isEmail ? recipient : undefined,
        mobile: !isEmail ? effectiveMobile : undefined,
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
          alert('Code Resent', t('auth.otpscreen.a_new_verification_code_has_been_sent_to_your', { isEmail: isEmail ? 'email' : 'mobile' }));
        },
        onError: (error: any) => {
          const rawError = extractApiErrorMessage(error, 'Could not resend OTP.');
          alert('Resend Failed', String(rawError));
        }
      }
    );
  };

  const handleVerify = async () => {
    const trimmedOtp = otp.trim();

    if (trimmedOtp.length < 4) {
      alert('Enter full OTP');
      return;
    }

    if (!registerSessionId) {
      alert(
        'Session Expired',
        'Your verification session is missing. Please resend OTP and try again.',
      );
      return;
    }

    setLoading(true);

    try {
      const verifyPayload = {
        email: isEmail ? recipient : undefined,
        mobile: !isEmail ? effectiveMobile : undefined,
        otp: trimmedOtp,
        sessionId: registerSessionId,
      };

      console.log("VERIFY PAYLOAD:", verifyPayload);

      const verifyData = await verifyRegisterOtp.mutateAsync(verifyPayload);

      console.log("VERIFY SUCCESS:", verifyData);

      // ✅ CLEANUP PREVIOUS SESSION ONBOARDING & GENDER STATE
      await AsyncStorage.removeItem("registerSessionId");
      await clearOnboardingState();
      await AsyncStorage.multiRemove([
        "GenderOrientation",
        "selectedGender",
        "userGender",
        "userDob",
        "firstImageUploaded",
        "onboardingStep",
        "onboardingImages",
        "profileImage",
        "@amara_mock_images",
      ]);
      setImages?.(Array(6).fill(null));
      setProfileImage?.(null);
      setProfileImageUrl?.(null);
      setProfileText?.('');
      setSelectedAppearance?.(null);
      setSelectedBodyType?.(null);
      setSelectedLanguages?.([]);
      setSelectedEthinicity?.(null);
      setSelectedSmoking?.(null);
      setSelectedDrinking?.(null);
      setSelectedLookingFor?.([]);
      setSelectedKids?.(null);
      setSelectedNetWorth?.(null);
      setEnglishSkillLevel?.(0);

      const targetUserId = verifyData?.userId || verifyData?.user?.userId || verifyData?.user?.id;
      const targetToken = verifyData?.token || verifyData?.data?.token;

      if (targetUserId) {
        const uidStr = String(targetUserId);
        await AsyncStorage.multiSet([
          [STORAGE_KEYS.userId, uidStr],
          ['userId', uidStr],
          ['@amara_current_user_id', uidStr],
        ]);
        try {
          await mockStore.setCurrentUserId(uidStr);
        } catch {}
      }

      if (targetToken) {
        await AsyncStorageService.setToken(targetToken);
        await AsyncStorage.setItem('userToken', targetToken);
        await AsyncStorage.setItem(STORAGE_KEYS.token, targetToken);
      }

      await AsyncStorage.multiSet([
        [STORAGE_KEYS.isLoggedIn, 'true'],
        [STORAGE_KEYS.acceptedTerms, 'true'],
        ['acceptedTerms', 'true'],
        [STORAGE_KEYS.onboardingStep, 'GenderOrientation'],
      ]);
      await markTermsAccepted();

      if (isEmail) {
        await AsyncStorage.setItem('userEmail', recipient);
        await AsyncStorage.setItem('email', recipient);
      } else if (effectiveMobile) {
        await AsyncStorage.setItem('phoneNumber', effectiveMobile);
        await AsyncStorage.setItem('userMobile', effectiveMobile);
      }

      if (effectiveName) {
        await AsyncStorage.setItem("name", effectiveName);
        await AsyncStorage.setItem("displayName", effectiveName);
        if (setName) setName(effectiveName);
        if (setDisplayName) setDisplayName(effectiveName);
      }

      // Best-effort background sync for terms acceptance
      try {
        acceptTerms.mutate(undefined);
      } catch {}

      if (setInitialScreen) {
        setInitialScreen('GenderOrientation');
      }

      // Navigate directly to GenderOrientation (bypassing Privacy step)
      navigation.replace("GenderOrientation");

    } catch (error: any) {
      console.log("VERIFY ERROR:", error);
      const msg = extractApiErrorMessage(error, "Verification failed");

      if (isRegisterSessionExpiredError(error)) {
        alert("Session Expired", "Please resend OTP");
      } else if (isInvalidOtpError(error)) {
        alert("Invalid OTP", "Please enter correct OTP");
      } else if (msg.toLowerCase().includes('duplicate entry') || msg.toLowerCase().includes('already exists')) {
        alert(
          "Account Ready", 
          "Your account is already registered. Please proceed to the Login screen.",
          [{ text: t('auth.otpscreen.go_to_login'), onPress: () => navigation.replace('Login') }]
        );
      } else {
        alert("Error", msg);
      }
    } finally {
      setLoading(false);
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
        colors={['#0F0D1A', '#180B2B', '#260F45', '#160B2C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardAvoid}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Back Button */}
              <View style={styles.headerRow}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Register')}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  activeOpacity={0.7}
                >
                  <Icon name="chevron-left" size={32} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Main Content Area */}
              <View style={styles.mainContent}>
                {/* Title */}
                <Text style={styles.title}>
                  {isEmail ? t('auth.otpscreen.verify_your_email_address') : t('auth.otpscreen.verify_your_mobile_number')}
                </Text>

                {/* Subtitle with Recipient & Resend Info */}
                <Text style={styles.subtitle}>{t('auth.otpscreen.weve_sent_a_6_digit_code_to')}{' '}
                  <Text style={styles.recipientHighlight}>
                    {recipient || (isEmail ? t('auth.otpscreen.your_email') : t('auth.otpscreen.your_mobile'))}
                  </Text>
                  . Please check your inbox and enter the code to verify. Didn't get it?{' '}
                  <Text
                    style={[styles.inlineResend, timer > 0 && styles.inlineResendDisabled]}
                    onPress={timer === 0 ? handleResend : undefined}
                  >
                    {timer > 0 ? t('auth.otpscreen.resend_in_s', { timer }) : 'Tap resend.'}
                  </Text>
                </Text>

                {/* Hidden Text Input for native typing & paste */}
                <TextInput
                  ref={inputRef}
                  style={styles.hiddenInput}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={(val) => {
                    const clean = val.replace(/\D/g, '').slice(0, 6);
                    setOtp(clean);
                  }}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  autoFocus={true}
                  caretHidden={true}
                />

                {/* 6 Individual Code Boxes */}
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => inputRef.current?.focus()}
                  style={styles.codeBoxesRow}
                >
                  {otpArray.map((digit, idx) => {
                    const isCurrentFocus =
                      isInputFocused && idx === (otp.length < 6 ? otp.length : 5);
                    const isFilled = Boolean(digit);
                    return (
                      <View
                        key={idx}
                        style={[
                          styles.codeBox,
                          isCurrentFocus && styles.codeBoxFocused,
                          isFilled && styles.codeBoxFilled,
                        ]}
                      >
                        {digit ? (
                          <Text style={styles.codeText}>{digit}</Text>
                        ) : isCurrentFocus ? (
                          <View style={styles.cursorBar} />
                        ) : null}
                      </View>
                    );
                  })}
                </TouchableOpacity>

                {/* Resend Prompt / Timer Row */}
                <View style={styles.resendRow}>
                  <Text style={styles.resendPrefix}>{t('auth.otpscreen.didnt_receive_code')}</Text>
                  <TouchableOpacity onPress={handleResend} disabled={timer > 0}>
                    <Text
                      style={[
                        styles.resendLink,
                        timer > 0 && styles.resendLinkDisabled,
                      ]}
                    >
                      {timer > 0 ? t('auth.otpscreen.resend_code_s', { timer }) : 'Tap resend'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                  {/* Primary Verify Button */}
                  <TouchableOpacity
                    style={[styles.verifyBtn, loading && { opacity: 0.8 }]}
                    onPress={handleVerify}
                    disabled={loading}
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={['#7C3AED', '#6D28D9', '#5B21B6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.verifyGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.verifyBtnText}>{t('auth.otpscreen.verify')}</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Secondary Change Email Button */}
                  <TouchableOpacity
                    style={styles.changeEmailBtn}
                    onPress={() =>
                      navigation.canGoBack()
                        ? navigation.goBack()
                        : navigation.navigate('Register')
                    }
                    activeOpacity={0.8}
                  >
                    <Text style={styles.changeEmailBtnText}>
                      {isEmail ? t('auth.otpscreen.change_email') : t('auth.otpscreen.change_mobile')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
      {AlertComponent}
    </View>
  );
};

function createStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#0F0D1A',
    },
    gradient: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
    },
    keyboardAvoid: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingTop: Platform.OS === 'android' ? 14 : 8,
      paddingBottom: 24,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      paddingTop: 4,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    mainContent: {
      flex: 1,
      paddingTop: 8,
    },
    title: {
      fontSize: 27,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: -0.5,
      marginBottom: 12,
      lineHeight: 35,
    },
    subtitle: {
      fontSize: 15,
      color: 'rgba(255, 255, 255, 0.72)',
      lineHeight: 22,
      marginBottom: 32,
    },
    recipientHighlight: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    inlineResend: {
      color: '#A78BFA',
      fontWeight: '700',
    },
    inlineResendDisabled: {
      color: 'rgba(255, 255, 255, 0.42)',
    },
    hiddenInput: {
      position: 'absolute',
      width: 1,
      height: 1,
      opacity: 0.01,
      left: -9999,
    },
    codeBoxesRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 22,
    },
    codeBox: {
      flex: 1,
      maxWidth: 52,
      height: 58,
      borderRadius: 14,
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.14)',
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 3,
    },
    codeBoxFocused: {
      borderColor: '#A78BFA',
      backgroundColor: 'rgba(124, 58, 237, 0.14)',
      shadowColor: '#7C3AED',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 4,
    },
    codeBoxFilled: {
      borderColor: 'rgba(255, 255, 255, 0.28)',
      backgroundColor: 'rgba(255, 255, 255, 0.09)',
    },
    codeText: {
      fontSize: 22,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    cursorBar: {
      width: 2,
      height: 24,
      backgroundColor: '#22D3EE',
      borderRadius: 1,
    },
    resendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 32,
    },
    resendPrefix: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.65)',
    },
    resendLink: {
      fontSize: 14,
      fontWeight: '700',
      color: '#A78BFA',
    },
    resendLinkDisabled: {
      color: 'rgba(255, 255, 255, 0.42)',
      fontWeight: '500',
    },
    buttonContainer: {
      width: '100%',
      marginTop: 8,
    },
    verifyBtn: {
      height: 54,
      borderRadius: 27,
      overflow: 'hidden',
      marginBottom: 12,
      shadowColor: '#7C3AED',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 6,
    },
    verifyGradient: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    verifyBtnText: {
      color: '#FFFFFF',
      fontSize: 16.5,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
    changeEmailBtn: {
      height: 52,
      borderRadius: 26,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.22)',
    },
    changeEmailBtnText: {
      color: '#FFFFFF',
      fontSize: 15.5,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
  });
}

export default OTPScreen;
