// // navigation/BottomTabs.tsx
// import React from 'react';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import HomeScreen from '../HomeTab/HomeScreen';
// import MessageScreen from '../MessageTab/MessageScreen';
// import ProfileScreen from '../ProfileTab/ProfileScreen';
// import MoreInfoScreen from '../MoreInfoTab/MoreInfoScreen';

// const Tab = createBottomTabNavigator();

// const BottomTabs = () => {
//   return (
//     <Tab.Navigator>
//       <Tab.Screen name="Home" component={HomeScreen} />
//       <Tab.Screen name="Message" component={MessageScreen} />
//       <Tab.Screen name="Profile" component={ProfileScreen} />
//       <Tab.Screen name="MoreInfo" component={MoreInfoScreen} />
//     </Tab.Navigator>
//   );
// };

// export default BottomTabs;











import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image } from 'react-native';
import HomeScreen from '../HomeTab/HomeScreen';
import MessageScreen from '../MessageTab/MessageScreen';
import ProfileScreen from '../ProfileTab/ProfileScreen';
import MoreInfoScreen from '../MoreInfoTab/MoreInfoScreen';
import { AuthStorage } from '../../api/authStorage';

const Tab = createBottomTabNavigator();

const BottomTabs = () => {
  const [isFemale, setIsFemale] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const checkGender = async () => {
      try {
        const userData = await AuthStorage.getUser();
        const gender = userData?.gender || '';
        console.log(gender === 'female')

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
          height: 65,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          position: 'absolute',
          backgroundColor: '#fff',
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowOffset: { width: 0, height: -4 },
          shadowRadius: 12,
          elevation: 8,
          borderTopWidth: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
        },
      }}
    >
      {!isFemale && (
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <Image
                source={require('../../assets/HomeTabImages/HomeTab.png')}
                style={{ width: 26, height: 26, tintColor: focused ? '#E94057' : '#bbb' }}
              />
            ),
          }}
        />
      )}
      <Tab.Screen
        name="Message"
        component={MessageScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../../assets/MessageTabImages/MessageTab.png')}
              style={{ width: 26, height: 26, tintColor: focused ? '#E94057' : '#bbb' }}
            />
          ),
        }}
      />
      <Tab.Screen
        name="MoreInfo"
        component={MoreInfoScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../../assets/MoreInfoTabImages/MoreInfoTab.png')}
              style={{ width: 26, height: 26, tintColor: focused ? '#E94057' : '#bbb' }}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../../assets/ProfileTabImages/ProfileTab.png')}
              style={{ width: 30, height: 26, tintColor: focused ? '#E94057' : '#bbb' }}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabs;
