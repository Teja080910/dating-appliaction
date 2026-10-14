import React, { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
  StatusBar,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import AttractiveLogo from '../../components/AttractiveLogo';
import { Colors, useTheme, type ThemeColors } from '../../theme';
import { STORAGE_KEYS, markTermsAccepted } from '../../utils/sessionState';
import { usePrivacy } from '../../api/usePrivacy';
import AppContext from '../../context/CreateGlobalStateContext';
import { useAlert } from '../../components/AlertModal';
import { t, useTranslation } from '../../i18n';

const PrivacyScreen = ({ navigation }: any) => {
  useTranslation();
  const [loading, setLoading] = useState(false);
  const isTransitioningRef = useRef(false);
  const { acceptTerms } = usePrivacy();
  const { setInitialScreen } = useContext(AppContext);
  const { alert, AlertComponent } = useAlert();
  const { themeColors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(themeColors, isDark), [themeColors, isDark]);

  const isSessionSyncError = (error: any) => {
    const status = Number(error?.response?.status);
    const message = String(
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      '',
    ).toLowerCase();

    return (
      status === 400 ||
      status === 401 ||
      status === 403 ||
      status === 404 ||
      message.includes('user not found') ||
      message.includes('profile not found') ||
      message.includes('invalid userid') ||
      message.includes('not found')
    );
  };

  const describeError = (error: any) => ({
    message: String(error?.message || t('onboarding.privacyscreen.unknown_error')),
    status: Number(error?.response?.status || 0) || null,
    details:
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      (typeof error?.response?.data === 'string' ? error.response.data : null) ||
      null,
  });

  const resolveNextRoute = async () => {
    return 'GenderOrientation';
  };

  // ✅ Disable back + save step
  useFocusEffect(
    useCallback(() => {
      if (isTransitioningRef.current) {
        return undefined;
      }

      AsyncStorage.setItem('onboardingStep', 'Privacy');
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => true
      );
      return () => backHandler.remove();
    }, [])
  );

  // ✅ Accept Handler
  const handleAccept = async () => {
    if (loading) return;

    try {
      setLoading(true);
      const nextRoute = await resolveNextRoute();
      console.log('[privacy] Attempting to proceed to:', nextRoute);

      await markTermsAccepted();
      await AsyncStorage.setItem(STORAGE_KEYS.onboardingStep, nextRoute);

      isTransitioningRef.current = true;

      try {
        navigation.reset({
          index: 0,
          routes: [{ name: nextRoute }],
        });
        console.log('[privacy] Navigation reset success:', nextRoute);
      } catch (navErr) {
        console.warn('[privacy] reset failed, trying replace:', describeError(navErr));
        navigation.replace(nextRoute);
      }

      setInitialScreen(nextRoute);
      setLoading(false);

      // Best-effort sync
      setTimeout(() => {
        (async () => {
          try {
            acceptTerms.mutate(undefined, {
              onError: (error: any) => {
                if (!isSessionSyncError(error)) {
                  console.warn('[privacy] Background sync failed:', error?.message);
                }
              },
            });
          } catch (backgroundError) {}
        })();
      }, 0);

    } catch (error: any) {
      console.warn('[privacy] Accept terms error:', describeError(error));
      isTransitioningRef.current = false;
      alert('Error', 'Unable to proceed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={themeColors.primary} />
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[themeColors.primary, themeColors.secondary]} style={styles.hero}>
          <View style={styles.progressBarWrapper}>
            <View style={styles.progress} />
          </View>
          <AttractiveLogo size={72} />
          <Text style={styles.header}>{t('onboarding.privacyscreen.your_profile_stays_selective_private_and_intentional')}</Text>
          <Text style={styles.heroCopy}>{t('onboarding.privacyscreen.we_only_use_your_details_to_improve_matching_safety_and_account_access')}</Text>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.checkRow}>
            <Icon name="check-circle" size={24} color={themeColors.primary} />
            <Text style={styles.agreeText}>{t('onboarding.privacyscreen.by_continuing_you_agree_to_our_terms_of_use_and_privacy_policy_and_all')}</Text>
          </View>

          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => navigation.navigate('PrivacyPolicy', { type: 'terms' })}
          >
            <View style={styles.linkRow}>
              <Icon name="file-text" size={18} color="#2196F3" style={styles.linkIcon} />
              <Text style={styles.linkText}>Terms of Use</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => navigation.navigate('PrivacyPolicy', { type: 'privacy' })}
          >
            <View style={styles.linkRow}>
              <Icon name="file-text" size={18} color="#2196F3" style={styles.linkIcon} />
              <Text style={styles.linkText}>{t('auth.forgotpasswordscreen.privacy_policy')}</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.footer}>{t('onboarding.privacyscreen.we_store_location_profile_details_and_activity_state_only_to_personali')}</Text>

          <TouchableOpacity 
            style={[styles.acceptBtn, loading && styles.disabledAcceptBtn]} 
            onPress={handleAccept} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.acceptBtnText}>{t('onboarding.privacyscreen.accept_terms_and_privacy_policy')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      {AlertComponent}
    </SafeAreaView>
  );
};

const createStyles = (themeColors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: themeColors.primary },
    scrollContent: { flexGrow: 1, backgroundColor: themeColors.background },
    hero: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 24, alignItems: 'center' },
    content: {
      padding: 24,
      flexGrow: 1,
      justifyContent: 'center',
      marginTop: -18,
      backgroundColor: themeColors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderWidth: 1,
      borderColor: themeColors.border,
      borderBottomWidth: 0,
    },
    progressBarWrapper: { height: 5, backgroundColor: 'rgba(255,255,255,0.28)', borderRadius: 5, overflow: 'hidden', marginTop: 10, marginBottom: 28, width: '100%' },
    progress: { height: 5, width: '10%', backgroundColor: '#fff' },
    header: { fontSize: 24, fontWeight: 'bold', marginTop: 16, marginBottom: 10, color: '#fff', textAlign: 'center' },
    heroCopy: { fontSize: 14, color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 21, marginTop: 10 },
    checkRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
    agreeText: { flex: 1, color: themeColors.textSecondary, fontSize: 14, marginLeft: 10, lineHeight: 20 },
    linkBtn: {
      borderWidth: 1.5,
      borderColor: themeColors.border,
      paddingVertical: 14,
      paddingHorizontal: 18,
      borderRadius: 15,
      marginVertical: 6,
      backgroundColor: isDark ? themeColors.background : themeColors.surfaceLight,
    },
    linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    linkIcon: { marginRight: 10 },
    linkText: { fontWeight: '700', fontSize: 14, color: themeColors.text },
    footer: { marginTop: 22, fontSize: 12, color: themeColors.textMuted, lineHeight: 18, textAlign: 'center' },
    acceptBtn: {
      backgroundColor: themeColors.primary,
      borderRadius: 30,
      paddingVertical: 16,
      marginTop: 24,
      alignItems: 'center',
      elevation: 4,
      shadowColor: themeColors.primary,
      shadowOpacity: 0.3,
      shadowRadius: 10,
      marginBottom: 8,
    },
    disabledAcceptBtn: { opacity: 0.75 },
    acceptBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  });

export default PrivacyScreen;
