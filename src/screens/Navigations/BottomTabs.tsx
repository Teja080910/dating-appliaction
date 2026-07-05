import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image, View } from 'react-native';
import HomeScreen from '../HomeTab/HomeScreen';
import MessageScreen from '../MessageTab/MessageScreen';
import ProfileScreen from '../ProfileTab/ProfileScreen';
import MoreInfoScreen from '../MoreInfoTab/MoreInfoScreen';
import { AuthStorage } from '../../api/authStorage';
import { colors } from '../../constants/theme';

const Tab = createBottomTabNavigator();

const TabIcon = ({ source, focused, size = 24 }: { source: any; focused: boolean; size?: number }) => (
  <View style={{ alignItems: 'center', justifyContent: 'center', width: 40 }}>
    <Image
      source={source}
      style={{ width: size, height: size, tintColor: focused ? colors.primary : colors.inkFaint }}
    />
    <View
      style={{
        marginTop: 5,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: focused ? colors.primary : 'transparent',
      }}
    />
  </View>
);

const BottomTabs = () => {
  const [isFemale, setIsFemale] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const checkGender = async () => {
      try {
        const userData = await AuthStorage.getUser();
        const gender = userData?.gender || '';
        setIsFemale(gender === 'female');
      } catch {}
      setLoaded(true);
    };
    checkGender();
  }, []);

  if (!loaded) return null;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarShowLabel: false,
        headerShown: false,
        tabBarStyle: {
          height: 68,
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          position: 'absolute',
          backgroundColor: colors.surface,
          shadowColor: '#5B1030',
          shadowOpacity: 0.1,
          shadowOffset: { width: 0, height: -4 },
          shadowRadius: 16,
          elevation: 8,
          borderTopWidth: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 10,
        },
      }}
    >
      {!isFemale && (
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon source={require('../../assets/HomeTabImages/HomeTab.png')} focused={focused} />
            ),
          }}
        />
      )}
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
            <TabIcon source={require('../../assets/ProfileTabImages/ProfileTab.png')} focused={focused} size={26} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabs;
