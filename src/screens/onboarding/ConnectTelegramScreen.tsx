import React, { useCallback } from 'react';
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
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { completeOnboarding } from '../../utils/session';
import { useTelegram } from '../../api/useTelegram';

const ConnectTelegramScreen = ({navigation}: any) => {
  const { getTelegramLink } = useTelegram();

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.setItem('onboardingStep', 'ConnectTelegram');

      const onBackPress = () => {
         navigation.replace('AboutProfile');
         return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

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

      await completeOnboarding();
      navigation.navigate('BottomTabs');
    } catch (error) {
      console.error('Telegram Error:', error);
      Alert.alert('Telegram Connect', 'We could not open the Telegram bot right now. You can continue onboarding and connect Telegram later from your profile.', [
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Progress bar */}
      <View style={styles.progressBackground}>
        <View style={styles.progressBar} />
      </View>

      {/* Top controls */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipBtnText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
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

            <TouchableOpacity style={styles.connectBtn} onPress={handleConnectTelegram}>
                <Text style={styles.connectBtnText}>Connect Telegram</Text>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  progressBackground: {
    height: 4,
    backgroundColor: '#eee',
    borderRadius: 2,
    marginTop: 10,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: 4,
    width: '95%',
    backgroundColor: '#FF5A79',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  closeIcon: {
    fontSize: 26,
    color: '#FF5A79',
    fontWeight: '300',
  },
  skipBtn: {
    backgroundColor: '#AAA',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 8,
  },
  skipBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
      flex: 1,
      justifyContent: 'center',
      paddingBottom: 40,
  },
  card: {
    padding: 30,
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  telegramIcon: {
    width: 60,
    height: 60,
    alignSelf: 'center',
    marginBottom: 20,
  },
  heading: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    color: '#000000',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    color: '#666666',
    marginBottom: 25,
    lineHeight: 22,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingHorizontal: 5,
  },
  bullet: {
    fontSize: 18,
    marginRight: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    fontWeight: '600',
  },
  connectBtn: {
    backgroundColor: '#0088CC',
    height: 56,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 25,
    elevation: 4,
    shadowColor: '#0088CC',
    shadowOpacity: 0.3,
  },
  connectBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#BBB',
    lineHeight: 18,
  },
  bottomSkip: {
    marginTop: 30,
    alignSelf: 'center',
  },
  bottomSkipText: {
      color: '#AAA',
      fontSize: 15,
      fontWeight: '700',
      textDecorationLine: 'underline',
  }
});

export default ConnectTelegramScreen;
