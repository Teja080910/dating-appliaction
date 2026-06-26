import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image, StyleSheet, View, Platform, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import HomeScreen from '../HomeTab/HomeScreen';
import MessageScreen from '../MessageTab/MessageScreen';
import ProfileScreen from '../ProfileTab/ProfileScreen';
import MoreInfoScreen from '../MoreInfoTab/MoreInfoScreen';
import { Colors, Spacing, Shadows } from '../../theme';

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
  return (
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
      <Tab.Screen
        name="Message"
        component={MessageScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon source={require('../../assets/MessageTabImages/MessageTab.png')} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="MoreInfo"
        component={MoreInfoScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon source={require('../../assets/MoreInfoTabImages/MoreInfoTab.png')} focused={focused} />
          ),
        }}
      />
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
  );
};

const styles = StyleSheet.create({
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
