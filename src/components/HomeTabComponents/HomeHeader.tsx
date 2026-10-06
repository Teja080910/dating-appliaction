import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, PermissionsAndroid, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import AttractiveLogo from '../AttractiveLogo';
import { Colors, Spacing, Shadows, Typography, useTheme } from '../../theme';

interface Props {
  selectedFilter: 'online' | 'newest';
  onFilterChange: (filter: 'online' | 'newest') => void;
  onMenuPress?: () => void;
}

const NOTIFICATION_BANNER_KEY = 'notification_banner_dismissed';

const HomeHeader = ({ selectedFilter, onFilterChange }: Props) => {
  const { themeColors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
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
            title: 'Enable Notifications',
            message: 'Get instant alerts when you receive a new invite or match!',
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

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top + Spacing.xs }]}>
      {/* Top Notification Banner */}
      {bannerVisible && (
        <View style={styles.bannerContainer}>
          <TouchableOpacity
            style={styles.bannerLeft}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('NotificationsScreen')}
          >
            <View style={styles.bannerIconWrap}>
              <Icon name="bell" size={15} color={themeColors.primaryLight} />
            </View>
            <Text style={styles.bannerText} numberOfLines={2}>
              Don't miss a new invite — get notified instantly
            </Text>
          </TouchableOpacity>

          <View style={styles.bannerActions}>
            <TouchableOpacity
              style={styles.notifyButton}
              activeOpacity={0.85}
              onPress={handleNotifyMe}
            >
              <LinearGradient
                colors={[themeColors.primary, themeColors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.notifyGradient}
              >
                <Text style={styles.notifyButtonText}>Notify me!</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dismissButton}
              activeOpacity={0.7}
              onPress={handleDismissBanner}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="x" size={14} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Brand Header */}
      <View style={styles.brandRow}>
        <View style={styles.logoContainer}>
          <AttractiveLogo size={34} />
          <View style={styles.logoTextWrap}>
            <Text style={styles.logoText}>AMARA</Text>
            <Text style={styles.logoSubtext}>Curated private matches</Text>
          </View>
        </View>
      </View>

      {/* Filter and Tabs Row */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={styles.filterButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('SearchSettings')}
        >
          <Icon name="sliders" size={18} color={themeColors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.dividerLine} />

        <View style={styles.segmentedControl}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.toggleButton,
              selectedFilter === 'online' ? styles.activeButton : styles.inactiveButton,
            ]}
            onPress={() => onFilterChange('online')}
          >
            {selectedFilter === 'online' ? (
              <LinearGradient
                colors={[themeColors.primary, themeColors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.activeGradient}
              >
                <Text style={styles.activeText}>Last Active</Text>
              </LinearGradient>
            ) : (
              <View style={styles.inactiveContent}>
                <Text style={styles.inactiveText}>Last Active</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.toggleButton,
              selectedFilter === 'newest' ? styles.activeButton : styles.inactiveButton,
            ]}
            onPress={() => onFilterChange('newest')}
          >
            {selectedFilter === 'newest' ? (
              <LinearGradient
                colors={[themeColors.primary, themeColors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.activeGradient}
              >
                <Text style={styles.activeText}>Newest</Text>
              </LinearGradient>
            ) : (
              <View style={styles.inactiveContent}>
                <Text style={styles.inactiveText}>Newest</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};


const createStyles = (colors: any) =>
  StyleSheet.create({
    wrapper: {
      paddingHorizontal: 16,
      paddingBottom: 10,
      backgroundColor: colors.background,
    },
    bannerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.background === '#F8F9FA' ? '#EDE9FE' : 'rgba(124, 58, 237, 0.12)',
      borderRadius: 14,
      paddingVertical: 9,
      paddingHorizontal: 12,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    bannerLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 10,
    },
    bannerIconWrap: {
      marginRight: 8,
    },
    bannerText: {
      fontSize: 12.5,
      fontWeight: '500',
      color: colors.textPrimary,
      flexShrink: 1,
      lineHeight: 16,
    },
    bannerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    notifyButton: {
      borderRadius: 16,
      overflow: 'hidden',
    },
    notifyGradient: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    notifyButtonText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    dismissButton: {
      marginLeft: 8,
      padding: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
      paddingLeft: 2,
    },
    logoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    logoTextWrap: {
      marginLeft: 10,
    },
    logoText: {
      fontSize: 22,
      fontWeight: '900',
      color: colors.text,
      letterSpacing: 1,
    },
    logoSubtext: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '600',
      marginTop: 1,
    },
    controlsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    filterButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    dividerLine: {
      width: 1,
      height: 22,
      backgroundColor: colors.glassBorder,
      marginRight: 10,
    },
    segmentedControl: {
      flex: 1,
      flexDirection: 'row',
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      padding: 3,
    },
    toggleButton: {
      flex: 1,
      borderRadius: Spacing.radiusLg,
      overflow: 'hidden',
    },
    activeButton: {},
    inactiveButton: {
      backgroundColor: 'transparent',
    },
    activeGradient: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: Spacing.radiusLg,
    },
    inactiveContent: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    toggleIcon: {
      marginRight: 6,
    },
    activeText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    inactiveText: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '600',
    },
  });

export default HomeHeader;

