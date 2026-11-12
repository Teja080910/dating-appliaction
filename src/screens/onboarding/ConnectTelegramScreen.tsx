import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  BackHandler,
  ActivityIndicator,
  Platform,
  Linking,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { completeOnboarding } from '../../utils/session';
import { useTelegram, useTelegramBotName, useMyTelegramStatus, fetchAmaraBotName, fetchAmaraBotLink, DEFAULT_AMARA_BOT_USERNAME } from '../../api/useTelegram';
import { useProfile } from '../../api/useProfile';
import { Colors, useTheme } from '../../theme';
import { useAlert } from '../../components/AlertModal';
import { t, useTranslation } from '../../i18n';
import { openAmaraBot } from '../../utils/telegramHelper';
import { extractTelegram } from '../../utils/whatsappHelper';

const ConnectTelegramScreen = ({ navigation, route }: any) => {
  useTranslation();
  const isTab = route?.name === 'Telegram' || Boolean(route?.params?.isTab);
  const fromProfile = Boolean(route?.params?.fromProfile);
  const isOnboarding = !isTab && !fromProfile;

  const { disconnectTelegram } = useTelegram();
  const { data: dynamicBotName } = useTelegramBotName();
  const { data: myTgStatus, refetch: refetchTgStatus } = useMyTelegramStatus();
  const { useMyProfile } = useProfile();
  const { data: profile, refetch: refetchProfile } = useMyProfile(undefined);
  const { alert, AlertComponent } = useAlert();
  const { themeColors, isDark } = useTheme();

  const [loading, setLoading] = useState(false);
  const isDisconnectedRef = useRef(false);

  const cleanConnected = isDisconnectedRef.current
    ? ''
    : extractTelegram(myTgStatus?.telegramUsername, profile?.telegramUsername);

  // When returning to the app from Telegram, auto-refresh status
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void Promise.allSettled([refetchProfile(), refetchTgStatus?.()]);
      }
    });
    return () => sub.remove();
  }, [refetchProfile, refetchTgStatus]);

  useFocusEffect(
    useCallback(() => {
      if (isOnboarding) {
        AsyncStorage.setItem('onboardingStep', 'ConnectTelegram');
      }

      const onBackPress = () => {
        if (fromProfile && navigation.canGoBack()) {
          navigation.goBack();
          return true;
        }
        if (isOnboarding) {
          navigation.replace('UploadImage');
          return true;
        }
        return false;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backHandler.remove();
    }, [navigation, isOnboarding, fromProfile]),
  );

  const handleBack = () => {
    if (fromProfile && navigation.canGoBack()) {
      navigation.goBack();
    } else if (isOnboarding) {
      navigation.replace('UploadImage');
    }
  };

  const handleNextOrSkip = () => {
    if (isOnboarding) {
      navigation.navigate('AboutProfile');
    }
  };

  const handleConnectTelegramPress = async () => {
    isDisconnectedRef.current = false;
    setLoading(true);
    try {
      const botLink = await fetchAmaraBotLink();
      await openAmaraBot(botLink);
    } catch {
      const activeBot = await fetchAmaraBotName().catch(() => dynamicBotName || DEFAULT_AMARA_BOT_USERNAME);
      await openAmaraBot(activeBot);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    isDisconnectedRef.current = true;
    setLoading(true);
    try {
      await disconnectTelegram.mutateAsync({ userId: '' });
      await Promise.allSettled([refetchProfile(), refetchTgStatus?.()]);
    } catch (error: any) {
      console.warn('Telegram Disconnect Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? themeColors.background : '#FFFFFF' },
      ]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? themeColors.background : '#FFFFFF'}
      />

      {/* Header matching tab screen, profile settings, or onboarding 8-step bar */}
      {isTab ? (
        <View
          style={[
            styles.header,
            {
              borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
              backgroundColor: isDark ? themeColors.background : '#FFFFFF',
              justifyContent: 'center',
            },
          ]}
        >
          <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000', textAlign: 'center' }]}>
            {t('nav.bottomtabs.telegram')}
          </Text>
        </View>
      ) : fromProfile ? (
        <View
          style={[
            styles.header,
            {
              borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
              backgroundColor: isDark ? themeColors.background : '#FFFFFF',
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={28} color={isDark ? '#FFFFFF' : '#000000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>{t('nav.bottomtabs.telegram')}</Text>
        </View>
      ) : (
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Feather name="chevron-left" size={28} color={isDark ? '#FFFFFF' : '#000000'} />
          </TouchableOpacity>
          <View style={styles.progressBarWrapper}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((stepNum) => (
              <View
                key={stepNum}
                style={[
                  styles.progressDash,
                  stepNum <= 5
                    ? { backgroundColor: themeColors.primary }
                    : { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : '#E5E7EB' },
                ]}
              />
            ))}
          </View>
        </View>
      )}

      {/* Main Content */}
      <View style={styles.content}>
        {/* Description text matching screenshot */}
        <Text
          style={[
            styles.description,
            { color: isDark ? '#CBD5E1' : '#333333' },
          ]}
        >{t('onboarding.connecttelegramscreen.connect_telegram_to_receive_notifications_and_messages_through_the_ama')}</Text>

        {/* Card matching screenshot */}
        <View
          style={[
            styles.cardContainer,
            {
              borderColor: isDark ? 'rgba(56, 189, 248, 0.4)' : '#8FD2F8',
            },
          ]}
        >
          {/* Top Half: Connect / Disconnect Telegram Button */}
          <TouchableOpacity
            style={styles.connectButton}
            activeOpacity={0.85}
            onPress={cleanConnected ? handleDisconnect : handleConnectTelegramPress}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
            ) : (
              <Icon
                name="send"
                size={20}
                color="#FFFFFF"
                style={styles.sendIcon}
              />
            )}
            <Text style={styles.connectButtonText}>
              {cleanConnected ? 'Disconnect Telegram' : t('profile.contactdetails.connect_telegram')}
            </Text>
          </TouchableOpacity>

          {/* Bottom Half: Status Display */}
          <View
            style={[
              styles.statusArea,
              {
                backgroundColor: isDark ? 'rgba(46, 165, 232, 0.12)' : '#E5F3FD',
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: isDark ? '#BAE6FD' : '#0A3960' },
              ]}
            >
              {cleanConnected
                ? `Connected to: @${cleanConnected}`
                : `${t('profile.contactdetails.status')} Not connected`}
            </Text>
          </View>
        </View>

        {/* Bottom Actions for onboarding only */}
        {isOnboarding && (
          <View style={styles.onboardingActions}>
            <TouchableOpacity
              style={[
                styles.nextBtn,
                { backgroundColor: themeColors.primary },
              ]}
              onPress={handleNextOrSkip}
              activeOpacity={0.85}
            >
              <Text style={styles.nextBtnText}>{t('onboarding.aboutprofilescreen.next')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.bottomSkip} onPress={handleNextOrSkip}>
              <Text style={styles.bottomSkipText}>{t('onboarding.connecttelegramscreen.set_up_later')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {AlertComponent}
    </SafeAreaView>
  );
};

export default ConnectTelegramScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    paddingRight: 12,
    paddingVertical: 4,
  },
  progressBarWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressDash: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    paddingRight: 12,
    paddingVertical: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  onboardingActions: {
    marginTop: 32,
    alignItems: 'center',
  },
  nextBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    marginBottom: 20,
  },
  cardContainer: {
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  connectButton: {
    backgroundColor: '#2EA5E8',
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    marginRight: 8,
    transform: [{ rotate: '-45deg' }],
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  statusArea: {
    paddingVertical: 13,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 15,
    fontWeight: '500',
  },
  statusValue: {
    fontWeight: '600',
  },
  statusConnected: {
    color: '#059669',
  },
  bottomSkip: {
    marginTop: 36,
    alignSelf: 'center',
    paddingVertical: 8,
  },
  bottomSkipText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
