import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  BackHandler,
  ActivityIndicator,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { completeOnboarding } from '../../utils/session';
import { useTelegram } from '../../api/useTelegram';
import { useProfile } from '../../api/useProfile';
import { Colors, Spacing, Shadows } from '../../theme';
import { useAlert } from '../../components/AlertModal';

const ConnectTelegramScreen = ({ navigation, route }: any) => {
  const fromProfile = Boolean(route?.params?.fromProfile);
  const { connectTelegram } = useTelegram();
  const { useMyProfile } = useProfile();
  const { data: profile, refetch: refetchProfile } = useMyProfile(undefined);
  const { alert, AlertComponent } = useAlert();
  const [loading, setLoading] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState('');

  const connectedUsername = profile?.telegramUsername || '';

  useEffect(() => {
    if (profile?.userId) {
      setTelegramUsername(connectedUsername);
    }
  }, [profile?.userId]);

  useFocusEffect(
    useCallback(() => {
      if (!fromProfile) {
        AsyncStorage.setItem('onboardingStep', 'ConnectTelegram');
      }

      const onBackPress = () => {
        if (fromProfile || navigation.canGoBack()) {
          navigation.goBack();
          return true;
        }
        navigation.replace('AboutProfile');
        return true;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backHandler.remove();
    }, [navigation, fromProfile]),
  );

  const handleSkip = async () => {
    if (fromProfile) {
      navigation.goBack();
      return;
    }
    try {
      await completeOnboarding();
      navigation.navigate('BottomTabs');
    } catch (e) {
      navigation.navigate('BottomTabs');
    }
  };

  const handleBack = () => {
    if (fromProfile || navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('AboutProfile');
    }
  };

  const handleConnectTelegram = async () => {
    setLoading(true);
    try {
      const username = telegramUsername.trim().replace(/^@/, '');
      if (!username) {
        throw new Error('Enter your Telegram username, then tap Connect Telegram again.');
      }

      await connectTelegram.mutateAsync({ userId: '', username });
      await refetchProfile();

      setLoading(false);

      if (fromProfile) {
        alert('Telegram Connected', 'Your Telegram has been linked to your AMARA profile.', [
          { text: 'Done', onPress: () => navigation.goBack() },
        ]);
      } else {
        await completeOnboarding();
        navigation.navigate('BottomTabs');
      }
    } catch (error) {
      setLoading(false);
      console.error('Telegram Error:', error);
      if (fromProfile) {
        alert('Notice', error instanceof Error ? error.message : 'Could not connect Telegram right now.');
      } else {
        alert('Telegram Connect', 'We could not save your Telegram username right now. You can continue onboarding and connect Telegram later from your profile.', [
          {
            text: 'Continue',
            onPress: async () => {
              try {
                await completeOnboarding();
              } catch (e) {}
              navigation.navigate('BottomTabs');
            },
          },
        ]);
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={[Colors.background, Colors.surface]} style={styles.gradient}>
        <SafeAreaView style={styles.safeArea}>
          {!fromProfile && (
            <View style={styles.progressBackground}>
              <View style={styles.progressBar} />
            </View>
          )}

          <View style={styles.topBar}>
            <TouchableOpacity onPress={handleBack} style={styles.backBtnTouch}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>

            {!fromProfile && (
              <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
                <Text style={styles.skipBtnText}>Skip</Text>
              </TouchableOpacity>
            )}
          </View>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.card}>
                <Image
                  source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2111/2111646.png' }}
                  style={styles.telegramIcon}
                />

                <Text style={styles.heading}>
                  {connectedUsername ? 'Telegram Connected' : 'Connect Your Telegram'}
                </Text>

                {connectedUsername ? (
                  <View style={styles.connectedBadgeBox}>
                    <Text style={styles.connectedBadgeLabel}>ACTIVE HANDLE</Text>
                    <Text style={styles.connectedBadgeText}>
                      @{connectedUsername.replace('@', '')}
                    </Text>
                  </View>
                ) : null}

                <TextInput
                  style={styles.usernameInput}
                  value={telegramUsername}
                  onChangeText={setTelegramUsername}
                  placeholder="Telegram username (e.g. @yourname)"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Text style={styles.description}>
                  {connectedUsername
                    ? 'Your profile is connected to Telegram. Approved matches can reach you directly.'
                    : 'Add your Telegram username so approved matches can contact you safely.'}
                </Text>

                <View style={styles.bulletRow}>
                  <Text style={styles.bullet}>💙</Text>
                  <Text style={styles.bulletText}>Receive accepted invitations instantly on Telegram.</Text>
                </View>

                <View style={styles.bulletRow}>
                  <Text style={styles.bullet}>🔔</Text>
                  <Text style={styles.bulletText}>
                    Safe contact handoff only after request approval.
                  </Text>
                </View>

                <TouchableOpacity style={styles.connectBtn} onPress={handleConnectTelegram} disabled={loading}>
                  <LinearGradient
                    colors={[Colors.primary, Colors.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.connectGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color={Colors.white} />
                    ) : (
                      <Text style={styles.connectBtnText}>
                        {connectedUsername ? 'Update Telegram Username' : 'Connect Telegram'}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.footerText}>
                  Your Telegram information is private—we never reveal it before request approval.
                </Text>
              </View>

              {!fromProfile && (
                <TouchableOpacity style={styles.bottomSkip} onPress={handleSkip}>
                  <Text style={styles.bottomSkipText}>Keep it for later</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
      {AlertComponent}
    </View>
  );
};

export default ConnectTelegramScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  progressBackground: {
    height: 4,
    backgroundColor: Colors.surfaceLighter,
    borderRadius: 2,
    marginTop: Spacing.sm + 2,
    marginBottom: Spacing.sm + 2,
    marginHorizontal: Spacing.screenPaddingHorizontal,
    overflow: 'hidden',
  },
  progressBar: {
    height: 4,
    width: '95%',
    backgroundColor: Colors.primary,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 2,
  },
  backBtnTouch: {
    padding: 6,
  },
  closeIcon: {
    fontSize: 26,
    color: Colors.textSecondary,
    fontWeight: '300',
  },
  skipBtn: {
    backgroundColor: Colors.glass,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.radiusFull,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  skipBtnText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: Spacing.xl + 24,
  },
  card: {
    padding: Spacing.xl,
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radiusXxl,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    ...Shadows.xl,
  },
  telegramIcon: {
    width: 60,
    height: 60,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  heading: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  connectedBadgeBox: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.25)',
  },
  connectedBadgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#22c55e',
    letterSpacing: 0.5,
  },
  connectedBadgeText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  bullet: {
    fontSize: 18,
    marginRight: Spacing.sm + 2,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    fontWeight: '600',
  },
  connectBtn: {
    borderRadius: Spacing.radiusLg,
    overflow: 'hidden',
    marginVertical: Spacing.lg,
    ...Shadows.md,
  },
  connectGradient: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '900',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    color: Colors.textMuted,
    lineHeight: 18,
  },
  usernameInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.text,
    marginBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  bottomSkip: {
    marginTop: Spacing.xl,
    alignSelf: 'center',
  },
  bottomSkipText: {
    color: Colors.textMuted,
    fontSize: 15,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
