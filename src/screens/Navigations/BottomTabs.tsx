import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, Image, StyleSheet, View, Platform, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import HomeScreen from '../HomeTab/HomeScreen';
import ProfileScreen from '../ProfileTab/ProfileScreen';
import SentRequestsScreen from '../SentTab/SentRequestsScreen';
import MoreInfoScreen from '../MoreInfoTab/MoreInfoScreen';
import { getGender } from '../../utils/types/AsyncStorage';
import { Colors, Spacing, Shadows, useTheme } from '../../theme';
import apiClient, { getAbsoluteUrl } from '../../api/apiClient';
import { getUserId } from '../../utils/sessionHelper';

const Tab = createBottomTabNavigator();

const BottomTabs = () => {
  const { themeColors, isDark } = useTheme();
  const [isWoman, setIsWoman] = useState<boolean | null>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const insets = useSafeAreaInsets();


  useEffect(() => {
    let isMounted = true;
    const checkUserGenderAndAvatar = async () => {
      try {
        const [g1, g2, u, userData] = await Promise.all([
          getGender(),
          AsyncStorage.getItem('userGender'),
          AsyncStorage.getItem('user'),
          AsyncStorage.getItem('userData'),
        ]);

        let raw = g1 || g2 || '';
        if (!raw || raw === 'lgbtqia') {
          for (const json of [u, userData]) {
            if (json) {
              try {
                const parsed = JSON.parse(json);
                const candidate = parsed?.gender || parsed?.user?.gender || parsed?.profile?.gender;
                if (candidate) {
                  raw = candidate;
                  break;
                }
              } catch {}
            }
          }
        }

        // Check avatar from storage
        for (const json of [u, userData]) {
          if (json) {
            try {
              const parsed = JSON.parse(json);
              const img =
                parsed?.profileImageUrl ||
                parsed?.imageUrl ||
                parsed?.image ||
                parsed?.photos?.[0] ||
                parsed?.images?.[0] ||
                parsed?.profile?.profileImageUrl ||
                parsed?.profile?.photos?.[0];
              if (img && isMounted) {
                setAvatarUri(getAbsoluteUrl(img));
              }
            } catch {}
          }
        }

        if (!raw || raw === 'lgbtqia' || !avatarUri) {
          const userId = await getUserId();
          if (userId) {
            try {
              const response = await apiClient.post('/profile/me', null, { params: { userId } });
              const apiGender = response?.data?.gender || response?.data?.profile?.gender;
              if (apiGender && (!raw || raw === 'lgbtqia')) raw = String(apiGender);

              const apiImg =
                response?.data?.profileImageUrl ||
                response?.data?.profile?.profileImageUrl ||
                response?.data?.photos?.[0] ||
                response?.data?.profile?.photos?.[0];
              if (apiImg && isMounted) {
                setAvatarUri(getAbsoluteUrl(apiImg));
              }
            } catch {}
          }
        }

        const clean = String(raw).toLowerCase();
        if (isMounted) {
          setIsWoman(clean.includes('woman') || clean.includes('female'));
        }
      } catch {
        if (isMounted) setIsWoman(false);
      }
    };
    checkUserGenderAndAvatar();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isWoman === null) {
    return (
      <View style={[styles.loadingScreen, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  return (
    <Tab.Navigator
      tabBar={
        !isWoman
          ? (props) => (
              <MaleCustomTabBar
                {...props}
                avatarUri={avatarUri}
                insets={insets}
                themeColors={themeColors}
              />
            )
          : undefined
      }
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: themeColors.tabBarBackground,
          borderTopColor: themeColors.glassBorder,
        },
        tabBarActiveTintColor: themeColors.primary,
        tabBarInactiveTintColor: themeColors.textSecondary,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
      />

      {/* Invitations (Men) */}
      {!isWoman && (
        <Tab.Screen
          name="Sent"
          component={SentRequestsScreen}
        />
      )}

      {/* About me (Men) */}
      {!isWoman && (
        <Tab.Screen
          name="AboutMe"
          component={MoreInfoScreen}
        />
      )}

      {/* Profile (Men & Women) */}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
      />
    </Tab.Navigator>
  );
};

interface MaleCustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
  avatarUri: string | null;
  insets: any;
  themeColors: any;
}

const MaleCustomTabBar: React.FC<MaleCustomTabBarProps> = ({
  state,
  navigation,
  avatarUri,
  insets,
  themeColors,
}) => {
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 16);
  const barHeight = (Platform.OS === 'ios' ? 70 : 66) + Math.max(insets.bottom, 0);

  return (
    <View
      style={[
        styles.customBar,
        {
          paddingBottom: bottomInset,
          height: barHeight,
          backgroundColor: themeColors.tabBarBackground,
          borderTopColor: themeColors.glassBorder,
        },
      ]}
    >
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;


        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (route.name === 'Profile') {
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.8}
              style={styles.tabCol}
            >
              {isFocused ? (
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarGradientBorder}
                >
                  <Image
                    source={
                      avatarUri
                        ? { uri: avatarUri }
                        : require('../../assets/MessageTabImages/boy1.webp')
                    }
                    style={styles.avatarImg}
                  />
                </LinearGradient>
              ) : (
                <View style={[styles.avatarDefaultBorder, { borderColor: themeColors.glassBorderLight }]}>
                  <Image
                    source={
                      avatarUri
                        ? { uri: avatarUri }
                        : require('../../assets/MessageTabImages/boy1.webp')
                    }
                    style={styles.avatarImg}
                  />
                </View>
              )}
            </TouchableOpacity>
          );
        }

        let iconName = 'fire';
        let label = 'Discover';

        if (route.name === 'Home') {
          iconName = 'fire';
          label = 'Discover';
        } else if (route.name === 'Sent') {
          iconName = 'email-outline';
          label = 'Invitations';
        } else if (route.name === 'AboutMe') {
          iconName = 'clipboard-edit-outline';
          label = 'About me';
        }

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.7}
            style={styles.tabCol}
          >
            {isFocused ? (
              <LinearGradient
                colors={[themeColors.primary, themeColors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.activeIconWrap}
              >
                <MaterialCommunityIcons
                  name={iconName}
                  size={20}
                  color={themeColors.white || '#FFFFFF'}
                />
              </LinearGradient>
            ) : (
              <View style={styles.inactiveIconWrap}>
                <MaterialCommunityIcons
                  name={iconName}
                  size={22}
                  color={themeColors.textSecondary}
                />
              </View>
            )}
            <Text
              style={[
                styles.tabLabel,
                isFocused ? styles.tabLabelActive : [styles.tabLabelInactive, { color: themeColors.textSecondary }],
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};


const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  customBar: {
    backgroundColor: Colors.tabBarBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.glassBorder,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    ...Shadows.lg,
  },
  tabCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconWrap: {
    width: 44,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 3,
  },
  inactiveIconWrap: {
    width: 44,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 3,
  },
  tabLabel: {
    fontSize: 10.5,
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  avatarGradientBorder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarDefaultBorder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Colors.glassBorderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
});

export default BottomTabs;
