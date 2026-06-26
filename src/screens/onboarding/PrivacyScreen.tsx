import React, { useCallback, useContext, useRef, useState } from 'react';
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
import { Colors } from '../../utils/colors';
import { STORAGE_KEYS, markTermsAccepted } from '../../utils/sessionState';
import { usePrivacy } from '../../api/usePrivacy';
import AppContext from '../../context/CreateGlobalStateContext';
import { useAlert } from '../../components/AlertModal';

const PrivacyScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const isTransitioningRef = useRef(false);
  const { acceptTerms } = usePrivacy();
  const { setInitialScreen } = useContext(AppContext);
  const { alert, AlertComponent } = useAlert();

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
    message: String(error?.message || 'Unknown error'),
    status: Number(error?.response?.status || 0) || null,
    details:
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      (typeof error?.response?.data === 'string' ? error.response.data : null) ||
      null,
  });

  const resolveNextRoute = async () => {
    const hasGenderStep = await AsyncStorage.getItem('GenderOrientation');
    return hasGenderStep === 'true' ? 'DisplayName' : 'GenderOrientation';
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
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.hero}>
          <View style={styles.progressBarWrapper}>
            <View style={styles.progress} />
          </View>
          <AttractiveLogo size={72} />
          <Text style={styles.header}>Your profile stays selective, private, and intentional.</Text>
          <Text style={styles.heroCopy}>
            We only use your details to improve matching, safety, and account access. Nothing gets shared outside the experience you control.
          </Text>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.checkRow}>
            <Icon name="check-circle" size={24} color={Colors.primary} />
            <Text style={styles.agreeText}>
              By continuing, you agree to our terms of use and privacy policy and allow account data needed for safer matching.
            </Text>
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
              <Text style={styles.linkText}>Privacy Policy</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.footer}>
            We store location, profile details, and activity state only to personalize the app, verify sessions, and surface better nearby matches.
          </Text>

          <TouchableOpacity 
            style={[styles.acceptBtn, loading && styles.disabledAcceptBtn]} 
            onPress={handleAccept} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.acceptBtnText}>
                Accept terms and privacy policy
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      {AlertComponent}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { flexGrow: 1 },
  hero: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 24, alignItems: 'center' },
  content: { padding: 24, flexGrow: 1, justifyContent: 'center', marginTop: -18, backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  progressBarWrapper: { height: 5, backgroundColor: 'rgba(255,255,255,0.28)', borderRadius: 5, overflow: 'hidden', marginTop: 10, marginBottom: 28, width: '100%' },
  progress: { height: 5, width: '10%', backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginTop: 16, marginBottom: 10, color: '#fff', textAlign: 'center' },
  heroCopy: { fontSize: 14, color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 21, marginTop: 10 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  agreeText: { flex: 1, color: Colors.textSecondary, fontSize: 14, marginLeft: 10, lineHeight: 20 },
  linkBtn: { borderWidth: 1.5, borderColor: Colors.border, paddingVertical: 14, paddingHorizontal: 18, borderRadius: 15, marginVertical: 6, backgroundColor: Colors.background },
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  linkIcon: { marginRight: 10 },
  linkText: { fontWeight: '700', fontSize: 14, color: Colors.text },
  footer: { marginTop: 22, fontSize: 12, color: Colors.grey, lineHeight: 18, textAlign: 'center' },
  acceptBtn: { backgroundColor: Colors.primary, borderRadius: 30, paddingVertical: 16, marginTop: 24, alignItems: 'center', elevation: 4, shadowColor: Colors.primary, shadowOpacity: 0.3, shadowRadius: 10, marginBottom: 8 },
  disabledAcceptBtn: { opacity: 0.75 },
  acceptBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default PrivacyScreen;
