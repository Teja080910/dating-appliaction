import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, Image, StyleSheet, View, Platform, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import HomeScreen from '../HomeTab/HomeScreen';
import ProfileScreen from '../ProfileTab/ProfileScreen';
import SentRequestsScreen from '../SentTab/SentRequestsScreen';
import { getGender } from '../../utils/types/AsyncStorage';
import { Colors, Spacing, Shadows } from '../../theme';
import apiClient from '../../api/apiClient';
import { getUserId } from '../../utils/sessionHelper';

const Tab = createBottomTabNavigator();
const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
const isCompactDevice = windowWidth < 380 || windowHeight < 760;

const TabIcon = ({ source, focused }: { source: any; focused: boolean }) => (
  <View style={[styles.iconWrapper, focused && styles.activeIconWrapper]}>
    {focused && (
      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.activeGlow}
      />
    )}
    <Image
      source={source}
      style={[
        styles.icon,
        { tintColor: focused ? Colors.white : Colors.textMuted },
      ]}
    />
  </View>
);

const BottomTabs = () => {
  const [isWoman, setIsWoman] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    const checkUserGender = async () => {
      try {
        const [g1, g2, u] = await Promise.all([
          getGender(),
          AsyncStorage.getItem('userGender'),
          AsyncStorage.getItem('user'),
        ]);
        let raw = g1 || g2 || '';
        if (!raw || raw === 'lgbtqia') {
          if (u) {
            try {
              const parsed = JSON.parse(u);
              const candidate = parsed?.gender || parsed?.user?.gender || parsed?.profile?.gender;
              if (candidate) raw = candidate;
            } catch {}
          }
        }
        if (!raw || raw === 'lgbtqia') {
          const userId = await getUserId();
          if (userId) {
            const response = await apiClient.post('/profile/me', null, { params: { userId } });
            const apiGender = response?.data?.gender || response?.data?.profile?.gender;
            if (apiGender) raw = String(apiGender);
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
    checkUserGender();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    isWoman === null ? (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    ) : (
    <Tab.Navigator
      screenOptions={{
        tabBarShowLabel: false,
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon source={require('../../assets/HomeTabImages/HomeTab.png')} focused={focused} />
          ),
        }}
      />
      {/* PRD Section 5: Sent tab is men only */}
      {!isWoman && (
        <Tab.Screen
          name="Sent"
          component={SentRequestsScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon source={require('../../assets/MessageTabImages/MessageTab.png')} focused={focused} />
            ),
          }}
        />
      )}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon source={require('../../assets/ProfileTabImages/ProfileTab.png')} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
    )
  );
};

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  tabBar: {
    height: Platform.OS === 'ios' ? (isCompactDevice ? 80 : 88) : (isCompactDevice ? 64 : 72),
    backgroundColor: Colors.tabBarBackground,
    borderTopWidth: 0,
    borderTopLeftRadius: Spacing.radiusXxl,
    borderTopRightRadius: Spacing.radiusXxl,
    position: 'absolute',
    paddingBottom: Platform.OS === 'ios' ? (isCompactDevice ? 20 : 28) : (isCompactDevice ? 8 : 12),
    paddingTop: Spacing.sm,
    ...Shadows.lg,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  activeIconWrapper: {
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
  },
  activeGlow: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    opacity: 0.2,
  },
  icon: {
    width: isCompactDevice ? 22 : 24,
    height: isCompactDevice ? 22 : 24,
    zIndex: 1,
  },
});

export default BottomTabs;
