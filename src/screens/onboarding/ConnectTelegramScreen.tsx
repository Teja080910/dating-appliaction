import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  BackHandler,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { completeOnboarding } from '../../utils/session';
import { useTelegram } from '../../api/useTelegram';
import { Colors, Spacing, Shadows } from '../../theme';
import { useAlert } from '../../components/AlertModal';

const ConnectTelegramScreen = ({ navigation }: any) => {
  const { getTelegramLink, connectTelegram } = useTelegram();
  const { alert, AlertComponent } = useAlert();
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.setItem('onboardingStep', 'ConnectTelegram');

      const onBackPress = () => {
        navigation.replace('AboutProfile');
        return true;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backHandler.remove();
    }, [navigation]),
  );

  const handleSkip = async () => {
    try {
      await completeOnboarding();
      navigation.navigate('BottomTabs');
    } catch (e) {
      navigation.navigate('BottomTabs');
    }
  };

  const handleBack = () => {
    navigation.replace('AboutProfile');
  };

  const handleConnectTelegram = async () => {
    setLoading(true);
    const fallbackUrls = [
      'tg://resolve?domain=AmaraDatingBot',
      'https://t.me/AmaraDatingBot',
      'https://telegram.org/',
    ];

    const openFirstAvailableUrl = async (candidates: string[]) => {
      for (const candidate of candidates) {
        try {
          const canOpen = await Linking.canOpenURL(candidate);
          if (canOpen) {
            await Linking.openURL(candidate);
            return true;
          }
        } catch (error) {
          console.warn('Telegram URL open failed:', candidate, error);
        }
      }
      return false;
    };

    try {
      let telegramUrl: string | null = null;
      try {
        const linkResponse = await getTelegramLink.mutateAsync({});
        if (typeof linkResponse === 'string' && linkResponse.trim()) {
          telegramUrl = linkResponse.trim();
        } else if (linkResponse && typeof linkResponse === 'object') {
          const record = linkResponse as Record<string, unknown>;
          if (typeof record.link === 'string' && record.link.trim()) {
            telegramUrl = record.link.trim();
          } else if (typeof record.url === 'string' && record.url.trim()) {
            telegramUrl = record.url.trim();
          }
        }
      } catch (err) {
        console.warn('Telegram link fetch failed, using fallback bot link.');
      }

      const didOpen = await openFirstAvailableUrl(
        telegramUrl ? [telegramUrl, ...fallbackUrls] : fallbackUrls,
      );

      if (!didOpen) {
        throw new Error('Unable to open Telegram link');
      }

      try {
        await connectTelegram.mutateAsync({ userId: '' });
      } catch (connectErr: any) {
        const msg = connectErr?.response?.data?.message || connectErr?.message || 'Could not link Telegram.';
        console.warn('[Telegram] Connect registration failed:', msg);
        alert('Telegram Connect', msg);
      }

      await completeOnboarding();
      setLoading(false);
      navigation.navigate('BottomTabs');
    } catch (error) {
      setLoading(false);
      console.error('Telegram Error:', error);
      alert('Telegram Connect', 'We could not open the Telegram bot right now. You can continue onboarding and connect Telegram later from your profile.', [
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
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={[Colors.background, Colors.surface]} style={styles.gradient}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.progressBackground}>
            <View style={styles.progressBar} />
          </View>

          <View style={styles.topBar}>
            <TouchableOpacity onPress={handleBack}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
              <Text style={styles.skipBtnText}>Skip</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.card}>
              <Image
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2111/2111646.png' }}
                style={styles.telegramIcon}
              />

              <Text style={styles.heading}>Connect Your Telegram</Text>

              <Text style={styles.description}>
                Effortlessly manage your invitations directly from the Telegram app and invite nearby users with just one click.
              </Text>

              <View style={styles.bulletRow}>
                <Text style={styles.bullet}>💙</Text>
                <Text style={styles.bulletText}>Receive accepted invitations instantly on Telegram.</Text>
              </View>

              <View style={styles.bulletRow}>
                <Text style={styles.bullet}>🔔</Text>
                <Text style={styles.bulletText}>
                  Discover new profiles near you and send invites with a single tap.
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
                    <Text style={styles.connectBtnText}>Connect Telegram</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.footerText}>
                Your Telegram information is always private—we never share it with anyone.
              </Text>
            </View>

            <TouchableOpacity style={styles.bottomSkip} onPress={handleSkip}>
              <Text style={styles.bottomSkipText}>Keep it for later</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

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
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: Spacing.xl + 16,
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
    marginBottom: Spacing.xl,
  },
  heading: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 22,
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
    marginVertical: Spacing.xl,
    ...Shadows.md,
  },
  connectGradient: {
    height: 56,
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

export default ConnectTelegramScreen;
