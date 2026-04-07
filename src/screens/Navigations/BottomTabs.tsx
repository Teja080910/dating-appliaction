import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image, StyleSheet, View, Platform, Dimensions } from 'react-native';
import HomeScreen from '../HomeTab/HomeScreen';
import MessageScreen from '../MessageTab/MessageScreen';
import ProfileScreen from '../ProfileTab/ProfileScreen';
import MoreInfoScreen from '../MoreInfoTab/MoreInfoScreen';
import { Colors } from '../../utils/colors';

const Tab = createBottomTabNavigator();
const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
const isCompactDevice = windowWidth < 380 || windowHeight < 760;

const BottomTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarShowLabel: false,
        headerShown: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={focused && styles.activeIconContainer}>
                <Image
                source={require('../../assets/HomeTabImages/HomeTab.png')}
                style={[styles.icon, { tintColor: focused ? '#FF5A79' : '#999' }]}
                />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Message"
        component={MessageScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={focused && styles.activeIconContainer}>
                <Image
                source={require('../../assets/MessageTabImages/MessageTab.png')}
                style={[styles.icon, { tintColor: focused ? '#FF5A79' : '#999' }]}
                />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="MoreInfo"
        component={MoreInfoScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={focused && styles.activeIconContainer}>
                <Image
                source={require('../../assets/MoreInfoTabImages/MoreInfoTab.png')}
                style={[styles.icon, { tintColor: focused ? '#FF5A79' : '#999' }]}
                />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={focused && styles.activeIconContainer}>
                <Image
                source={require('../../assets/ProfileTabImages/ProfileTab.png')}
                style={[styles.iconProfile, { tintColor: focused ? '#FF5A79' : '#999' }]}
                />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: Platform.OS === 'ios' ? (isCompactDevice ? 80 : 85) : (isCompactDevice ? 64 : 70),
    backgroundColor: Colors.surface,
    borderTopWidth: 0,
    elevation: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 1,
    shadowRadius: 18,
    paddingBottom: Platform.OS === 'ios' ? (isCompactDevice ? 20 : 25) : (isCompactDevice ? 8 : 10),
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    position: 'absolute',
  },
  icon: {
    width: isCompactDevice ? 24 : 26,
    height: isCompactDevice ? 24 : 26,
  },
  iconProfile: {
    width: isCompactDevice ? 28 : 32,
    height: isCompactDevice ? 24 : 26,
  },
  activeIconContainer: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: Colors.lightPink,
  }
});

export default BottomTabs;
