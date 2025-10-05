import React, { useContext, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RegisterScreen from '../Auth/RegisterScreen';
import LoginScreen from '../Auth/LoginScreen';
import ForgotPasswordScreen from '../Auth/ForgotPasswordScreen';
import PrivacyScreen from '../onboarding/PrivacyScreen';
import HomeScreen from '../HomeTab/HomeScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DisplayNameScreen from '../onboarding/DisplayNameScreen';
import GenderOrientationScreen from '../onboarding/GenderOrientationScreen';
import DOBScreen from '../onboarding/DOBScreen';
import AppContext from '../../context/CreateGlobalStateContext';
import UploadImageScreen from '../onboarding/UploadImageScreen';
import BottomTabs from './BottomTabs';
import AboutProfileScreen from '../onboarding/AboutProfileScreen';
import ConnectTelegramScreen from '../onboarding/ConnectTelegramScreen';
import SearchScreen from '../SearchSettings/SearchScreen';
import ProfileSettingsScreen from '../ProfileTab/ProfileSettingsScreen';
import ViewMyProfileScreen from '../ProfileTab/ViewMyProfileScreen';


const Stack = createNativeStackNavigator();

const Routes = () => {
  // const [initialScreen, setInitialScreen] = useState<string | null>(null);

  const { initialScreen, setInitialScreen, login } = useContext(AppContext);
  useEffect(() => {
    const checkStatus = async () => {
      const isRegistered = await AsyncStorage.getItem('isRegistered');

      // const isRegistered = await storage.getIsRegistered();

      const acceptedTerms = await AsyncStorage.getItem('acceptedTerms');
      const selectGender = await AsyncStorage.getItem('GenderOrientation');
      const entryHomeScreen = await AsyncStorage.getItem('entryHomeScreen');
      const isLoggedIn = await AsyncStorage.getItem('isLoggedIn')
      // console.log('isRegistered:', isRegistered);
      // console.log('Accepted Terms:', acceptedTerms);
      // console.log('selectGender:', selectGender);
      // console.log('entryHomeScreen:', entryHomeScreen);

      console.log('login', isLoggedIn );
      
      
      if(entryHomeScreen === 'true') {
        setInitialScreen('BottomTabs');
      }
      else if(isLoggedIn  === 'true'){
        console.log('working fine');
        
        setInitialScreen('Privacy');
      }
      else if (acceptedTerms === 'true' || selectGender === 'true' || isRegistered === 'true') {

        console.log( 'isRegistered',await AsyncStorage.getItem('isRegistered') );
        console.log('acceptedTerms',await AsyncStorage.getItem('acceptedTerms'));
        console.log('GenderOrientation',await AsyncStorage.getItem('GenderOrientation'));
        setInitialScreen('Privacy');
      } else {
        console.log("this one working");
        
        setInitialScreen('Register');
      }
    };
    checkStatus();
  }, []);

  if (!initialScreen) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialScreen}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} />
        {/* <Stack.Screen name="Home" component={HomeScreen} /> */}
        <Stack.Screen name="DisplayName" component={DisplayNameScreen} />
        <Stack.Screen name="GenderOrientation" component={GenderOrientationScreen} />
        <Stack.Screen name="DOB" component={DOBScreen} />
        <Stack.Screen name="UploadImage" component={UploadImageScreen} />
        <Stack.Screen name="BottomTabs" component={BottomTabs} />
        <Stack.Screen name="AboutProfile" component={AboutProfileScreen} />
        <Stack.Screen name="ConnectTelegram" component={ConnectTelegramScreen} />
        <Stack.Screen name="SearchSettings" component={SearchScreen} />
        <Stack.Screen name="ProfileSettingsScreen" component={ProfileSettingsScreen} />
        <Stack.Screen name="ViewMyProfileScreen" component={ViewMyProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Routes;

