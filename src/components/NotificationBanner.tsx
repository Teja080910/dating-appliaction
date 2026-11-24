import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, PermissionsAndroid, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../theme';
import { t, useTranslation } from '../i18n';

const NOTIFICATION_BANNER_KEY = 'notification_banner_dismissed';

interface NotificationBannerProps {
  style?: any;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({ style }) => {
  useTranslation();
  const { themeColors, isDark } = useTheme();
  const [bannerVisible, setBannerVisible] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const checkBannerState = async () => {
      try {
        const dismissed = await AsyncStorage.getItem(NOTIFICATION_BANNER_KEY);
        if (dismissed === 'true') {
          if (isMounted) setBannerVisible(false);
          return;
        }

        if (Platform.OS === 'android' && Platform.Version >= 33) {
          const hasPermission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          if (hasPermission) {
            if (isMounted) setBannerVisible(false);
            return;
          }
        }

        if (isMounted) setBannerVisible(true);
      } catch {
        if (isMounted) setBannerVisible(true);
      }
    };

    checkBannerState();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleDismissBanner = async () => {
    try {
      await AsyncStorage.setItem(NOTIFICATION_BANNER_KEY, 'true');
    } catch {}
    setBannerVisible(false);
  };

  const handleNotifyMe = async () => {
    try {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: t('home.homeheader.enable_notifications'),
            message: t('home.homeheader.get_instant_alerts_when_you_receive_a_new_invite_or_match'),
            buttonPositive: 'Allow',
            buttonNegative: 'Not Now',
          }
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          await AsyncStorage.setItem(NOTIFICATION_BANNER_KEY, 'true');
          await AsyncStorage.setItem('notifications_enabled', 'true');
          setBannerVisible(false);
          Alert.alert('Notifications Enabled', "You'll be notified of new invites instantly!");
          return;
        } else {
          Alert.alert(
            'Notifications Off',
            'You can enable notifications in your phone Settings at any time.'
          );
          await AsyncStorage.setItem(NOTIFICATION_BANNER_KEY, 'true');
          setBannerVisible(false);
          return;
        }
      }

      await AsyncStorage.setItem(NOTIFICATION_BANNER_KEY, 'true');
      setBannerVisible(false);
      Alert.alert('Notifications Enabled', "You'll be notified of new invites instantly!");
    } catch {
      await AsyncStorage.setItem(NOTIFICATION_BANNER_KEY, 'true');
      setBannerVisible(false);
    }
  };

  if (!bannerVisible) return null;

  return (
    <View
      style={[
        styles.bannerContainer,
        {
          backgroundColor: isDark ? 'rgba(56, 189, 248, 0.12)' : '#E0F2FE',
          borderColor: isDark ? 'rgba(56, 189, 248, 0.25)' : '#BAE6FD',
        },
        style,
      ]}
    >
      <View style={styles.bannerLeft}>
        <Icon
          name="bell"
          size={14}
          color={isDark ? '#38BDF8' : '#0369A1'}
          style={styles.bellIcon}
        />
        <Text
          style={[
            styles.bannerText,
            { color: isDark ? '#E0F2FE' : '#0C4A6E' },
          ]}
          numberOfLines={2}
        >{t('home.homeheader.dont_miss_a_new_invite_get_notified_instantly')}</Text>
      </View>

      <View style={styles.bannerActions}>
        <TouchableOpacity
          style={[
            styles.notifyButton,
            { backgroundColor: isDark ? '#0284C7' : '#BAE6FD' },
          ]}
          activeOpacity={0.85}
          onPress={handleNotifyMe}
        >
          <Text
            style={[
              styles.notifyButtonText,
              { color: isDark ? '#FFFFFF' : '#0369A1' },
            ]}
          >{t('home.homeheader.notify_me')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dismissButton}
          activeOpacity={0.7}
          onPress={handleDismissBanner}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon
            name="x"
            size={14}
            color={isDark ? '#94A3B8' : '#0369A1'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default NotificationBanner;

const styles = StyleSheet.create({
  bannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  bannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  bellIcon: {
    marginRight: 8,
  },
  bannerText: {
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
    lineHeight: 16,
  },
  bannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notifyButton: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifyButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dismissButton: {
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
