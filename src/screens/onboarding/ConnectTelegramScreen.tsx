import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  BackHandler,
  ActivityIndicator,
  TextInput,
  Modal,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { completeOnboarding } from '../../utils/session';
import { useTelegram } from '../../api/useTelegram';
import { useProfile } from '../../api/useProfile';
import { Colors, useTheme } from '../../theme';
import { useAlert } from '../../components/AlertModal';
import { t, useTranslation } from '../../i18n';

const ConnectTelegramScreen = ({ navigation, route }: any) => {
  useTranslation();
  const fromProfile = Boolean(route?.params?.fromProfile);
  const { connectTelegram, disconnectTelegram } = useTelegram();
  const { useMyProfile } = useProfile();
  const { data: profile, refetch: refetchProfile } = useMyProfile(undefined);
  const { alert, AlertComponent } = useAlert();
  const { themeColors, isDark } = useTheme();

  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

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
        navigation.replace('UploadImage');
        return true;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backHandler.remove();
    }, [navigation, fromProfile]),
  );

  const handleBack = () => {
    if (fromProfile || navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('UploadImage');
    }
  };

  const handleNextOrSkip = () => {
    if (fromProfile) {
      navigation.goBack();
      return;
    }
    navigation.navigate('AboutProfile');
  };

  const handleConnectTelegramPress = async () => {
    // Open Telegram bot directly
    const botUrl = 'https://t.me/amara_dating_bot';
    const appUrl = 'tg://resolve?domain=amara_dating_bot';

    try {
      const supported = await Linking.canOpenURL(appUrl);
      if (supported) {
        await Linking.openURL(appUrl);
      } else {
        await Linking.openURL(botUrl);
      }
    } catch {
      Linking.openURL(botUrl).catch(() => {});
    }

    // Open username linking modal
    setModalVisible(true);
  };

  const handleSaveUsername = async () => {
    const username = telegramUsername.trim().replace(/^@+/, '');
    if (!username) {
      alert('Username Required', 'Please enter your Telegram username.');
      return;
    }

    // Telegram username format: 5 to 32 characters, letters, numbers, underscores
    const TELEGRAM_USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{3,31}$/;
    if (!TELEGRAM_USERNAME_REGEX.test(username)) {
      alert(
        'Invalid Username',
        'Username must start with a letter and contain 4-32 alphanumeric characters or underscores.'
      );
      return;
    }

    setLoading(true);
    try {
      await connectTelegram.mutateAsync({ userId: '', username });
      await refetchProfile();
      setLoading(false);
      setModalVisible(false);
      alert('Connected', t('profile.contactdetails.your_telegram_account_is_now_connected', { username }));
    } catch (error: any) {
      setLoading(false);
      alert('Error', error?.message || t('onboarding.connecttelegramscreen.could_not_save_telegram_username'));
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await disconnectTelegram.mutateAsync({ userId: '' });
      await refetchProfile();
      setTelegramUsername('');
      setLoading(false);
      setModalVisible(false);
      alert('Disconnected', 'Your Telegram account has been disconnected.');
    } catch (error: any) {
      setLoading(false);
      alert('Error', error?.message || t('onboarding.connecttelegramscreen.could_not_disconnect_telegram'));
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

      {/* Header matching screenshot or onboarding 8-step bar */}
      {fromProfile ? (
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
          {/* Top Half: Connect Telegram Button */}
          <TouchableOpacity
            style={styles.connectButton}
            activeOpacity={0.85}
            onPress={handleConnectTelegramPress}
          >
            <Icon
              name="send"
              size={20}
              color="#FFFFFF"
              style={styles.sendIcon}
            />
            <Text style={styles.connectButtonText}>{t('profile.contactdetails.connect_telegram')}</Text>
          </TouchableOpacity>

          {/* Bottom Half: Status Display */}
          <TouchableOpacity
            style={[
              styles.statusArea,
              {
                backgroundColor: isDark ? 'rgba(46, 165, 232, 0.12)' : '#E5F3FD',
              },
            ]}
            activeOpacity={cleanConnected ? 0.7 : 1}
            onPress={() => {
              if (cleanConnected) setModalVisible(true);
            }}
          >
            <Text
              style={[
                styles.statusText,
                { color: isDark ? '#BAE6FD' : '#0A3960' },
              ]}
            >{t('profile.contactdetails.status')}{' '}
              <Text
                style={[
                  styles.statusValue,
                  cleanConnected ? styles.statusConnected : null,
                ]}
              >
                {cleanConnected ? t('profile.contactdetails.connected', { cleanConnected }) : 'Not connected'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Actions for onboarding */}
        {!fromProfile && (
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

      {/* Modal for entering/editing Telegram username or disconnecting */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: isDark ? '#1A1730' : '#FFFFFF' },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: isDark ? '#FFFFFF' : '#0F172A' },
              ]}
            >
              {cleanConnected ? t('profile.contactdetails.manage_telegram') : t('profile.contactdetails.link_telegram_account')}
            </Text>

            <Text
              style={[
                styles.modalSubtitle,
                { color: isDark ? '#94A3B8' : '#64748B' },
              ]}
            >{t('profile.contactdetails.enter_your_telegram_username_to_connect_with_the_amara_telegram_bot')}</Text>

            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: isDark ? '#262244' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#E2E8F0',
                },
              ]}
            >
              <Text style={styles.atPrefix}>@</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  { color: isDark ? '#FFFFFF' : '#0F172A' },
                ]}
                placeholder="username"
                placeholderTextColor="#94A3B8"
                value={telegramUsername}
                onChangeText={(val) =>
                  setTelegramUsername(val.replace(/^@+/, '').replace(/\s+/g, ''))
                }
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.modalBtnRow}>
              {cleanConnected ? (
                <TouchableOpacity
                  style={styles.disconnectBtn}
                  onPress={handleDisconnect}
                  disabled={loading}
                >
                  <Text style={styles.disconnectBtnText}>{t('profile.contactdetails.disconnect')}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.cancelModalBtn}
                  onPress={() => setModalVisible(false)}
                  disabled={loading}
                >
                  <Text style={styles.cancelModalBtnText}>{t('profile.additionaluploadsection.cancel')}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.saveModalBtn}
                onPress={handleSaveUsername}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveModalBtnText}>{t('more_info.savebutton.save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 22,
  },
  atPrefix: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2EA5E8',
    marginRight: 4,
  },
  modalInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 0,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelModalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelModalBtnText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '600',
  },
  disconnectBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  disconnectBtnText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '600',
  },
  saveModalBtn: {
    backgroundColor: '#2EA5E8',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveModalBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
