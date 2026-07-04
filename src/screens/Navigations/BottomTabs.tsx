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
        tabBarShowLabel: false, // Hides the "Home", "Message" text
        headerShown: false,
        tabBarStyle: {
          height: 60,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          position: 'absolute',
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
                style={{ width: 24, height: 24, tintColor: focused ? '#000' : '#ccc' }}
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
              source={require('../../assets/MessageTabImages/MessageTab.png')} // replace with your actual icon path
              style={{ width: 24, height: 24, tintColor: focused ? '#000' : '#ccc' }}
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
              source={require('../../assets/MoreInfoTabImages/MoreInfoTab.png')} // replace with your actual icon path
              style={{ width: 24, height: 24, tintColor: focused ? '#000' : '#ccc' }}
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
              source={require('../../assets/ProfileTabImages/ProfileTab.png')} // replace with your actual icon path
              style={{ width: 30, height: 24, tintColor: focused ? '#000' : '#ccc' }}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabs;
