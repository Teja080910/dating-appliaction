import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image, StyleSheet, View, Platform } from 'react-native';
import HomeScreen from '../HomeTab/HomeScreen';
import MessageScreen from '../MessageTab/MessageScreen';
import ProfileScreen from '../ProfileTab/ProfileScreen';
import MoreInfoScreen from '../MoreInfoTab/MoreInfoScreen';

const Tab = createBottomTabNavigator();

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
    height: Platform.OS === 'ios' ? 85 : 70,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
  },
  icon: {
    width: 26,
    height: 26,
  },
  iconProfile: {
    width: 32,
    height: 26,
  },
  activeIconContainer: {
      paddingBottom: 2,
      borderBottomWidth: 2,
      borderBottomColor: '#FF5A79',
  }
});

export default BottomTabs;
