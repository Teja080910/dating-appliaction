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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

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
  const [isFocused, setIsFocused] = useState(false);

  const rawConnected = profile?.telegramUsername || '';
  const cleanConnected = rawConnected.replace(/^@+/, '');
  const [telegramUsername, setTelegramUsername] = useState(cleanConnected);

  useEffect(() => {
    if (cleanConnected) {
      setTelegramUsername(cleanConnected);
    }
  }, [cleanConnected]);

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

  const handleUsernameChange = (val: string) => {
    // Strip leading @ and any internal spaces for effortless input
    setTelegramUsername(val.replace(/^@+/, '').replace(/\s+/g, ''));
  };

  const handleConnectTelegram = async () => {
    setLoading(true);
    try {
      const username = telegramUsername.trim().replace(/^@+/, '');
      if (!username) {
        throw new Error('Please enter your Telegram username.');
      }

      // Telegram username format: 5 to 32 characters, letters, numbers, underscores, starting with letter
      const TELEGRAM_USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/;
      if (!TELEGRAM_USERNAME_REGEX.test(username)) {
        throw new Error(
          'Invalid username. It must be 5 to 32 characters, start with a letter, and contain only letters, numbers, and underscores (e.g. yourname).'
        );
      }

      await connectTelegram.mutateAsync({ userId: '', username });
      await refetchProfile();

      setLoading(false);

      if (fromProfile) {
        alert('Saved', 'Your Telegram username has been updated successfully.', [
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
        alert('Notice', error instanceof Error ? error.message : 'Could not save Telegram username right now.');
      } else {
        alert('Telegram Connect', error instanceof Error ? error.message : 'We could not save your Telegram username right now. You can continue onboarding and connect Telegram later from your profile.', [
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
      <LinearGradient colors={[Colors.background, '#13111C']} style={styles.gradient}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          {fromProfile ? (
            <View style={styles.profileHeader}>
              <TouchableOpacity
                onPress={handleBack}
                style={styles.backBtnTouch}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="arrow-left" size={24} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.profileHeaderTitle}>Telegram</Text>
              <View style={styles.headerRightPlaceholder} />
            </View>
          ) : (
            <View style={styles.onboardingTopBar}>
              <View style={styles.progressBackground}>
                <View style={styles.progressBar} />
              </View>
              <View style={styles.topBarRow}>
                <TouchableOpacity
                  onPress={handleBack}
                  style={styles.backBtnTouch}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon name="close" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
                  <Text style={styles.skipBtnText}>Skip</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.topSection}>
                {/* Telegram Icon */}
                <View style={styles.iconCircle}>
                  <Image
                    source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2111/2111646.png' }}
                    style={styles.telegramIcon}
                  />
                </View>

                {/* Heading */}
                <Text style={styles.heading}>
                  {cleanConnected ? 'Your Telegram Handle' : 'What’s your Telegram?'}
                </Text>

                {/* Subtitle */}
                <Text style={styles.subtitle}>
                  Approved matches can contact you safely once a date invitation is accepted.
                </Text>

                {/* Native Input with Fixed @ Badge */}
                <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}>
                  <View style={styles.atBadge}>
                    <Text style={styles.atText}>@</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    value={telegramUsername}
                    onChangeText={handleUsernameChange}
                    placeholder="username"
                    placeholderTextColor={Colors.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                  />
                  {telegramUsername.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setTelegramUsername('')}
                      style={styles.clearBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Icon name="close-circle" size={18} color={Colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Legible Guide Box */}
                <View style={styles.guideCard}>
                  <View style={styles.guideHeaderRow}>
                    <Icon name="lightbulb-on-outline" size={17} color="#facc15" style={{ marginRight: 6 }} />
                    <Text style={styles.guideTitle}>How to find your username</Text>
                  </View>
                  <Text style={styles.guideBody}>
                    In Telegram, go to <Text style={styles.guideBold}>Settings</Text> →{' '}
                    <Text style={styles.guideBold}>Username</Text> (or Edit Profile → Username).
                  </Text>
                  <Text style={styles.guideNote}>
                    Use your Telegram handle, not your phone number or display name.
                  </Text>
                </View>
              </View>

              {/* Bottom Actions */}
              <View style={styles.bottomSection}>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleConnectTelegram}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[Colors.primary, Colors.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.saveGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color={Colors.white} />
                    ) : (
                      <Text style={styles.saveBtnText}>
                        {fromProfile || cleanConnected ? 'Save' : 'Continue'}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.privacyNote}>
                  🔒 Private & confidential. Never revealed without mutual approval.
                </Text>

                {!fromProfile && (
                  <TouchableOpacity style={styles.bottomSkip} onPress={handleSkip}>
                    <Text style={styles.bottomSkipText}>Set up later</Text>
                  </TouchableOpacity>
                )}
              </View>
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
  container: { flex: 1, backgroundColor: Colors.background },
  gradient: { flex: 1 },
  safeArea: { flex: 1 },

  // Profile Header
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  profileHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  headerRightPlaceholder: {
    width: 32,
  },

  // Onboarding Header
  onboardingTopBar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  progressBackground: {
    height: 4,
    backgroundColor: Colors.surfaceLighter,
    borderRadius: 2,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  progressBar: {
    height: 4,
    width: '95%',
    backgroundColor: Colors.primary,
  },
  topBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.sm,
  },
  backBtnTouch: {
    padding: 6,
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

  // Scroll Content
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl + 10,
    justifyContent: 'space-between',
  },
  topSection: {
    alignItems: 'center',
    width: '100%',
  },

  // Icon
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(36, 161, 222, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(36, 161, 222, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  telegramIcon: {
    width: 44,
    height: 44,
  },

  // Heading & Subtitle
  heading: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs + 4,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: 10,
  },

  // Input Field with Fixed @ Prefix
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    borderRadius: 14,
    width: '100%',
    paddingHorizontal: 14,
    height: 56,
    marginBottom: Spacing.lg,
  },
  inputContainerFocused: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(124, 58, 237, 0.05)',
  },
  atBadge: {
    paddingRight: 6,
    justifyContent: 'center',
  },
  atText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },

  // Guide Card
  guideCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 4,
  },
  guideHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  guideTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: 0.2,
  },
  guideBody: {
    fontSize: 13,
    lineHeight: 19,
    color: '#CBD5E1', // bright, readable slate-200
    marginBottom: 4,
  },
  guideBold: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  guideNote: {
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textMuted,
  },

  // Bottom Actions
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    paddingTop: Spacing.xl,
  },
  saveBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    ...Shadows.md,
  },
  saveGradient: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  privacyNote: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 16,
  },
  bottomSkip: {
    marginTop: Spacing.lg,
    paddingVertical: 6,
  },
  bottomSkipText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
