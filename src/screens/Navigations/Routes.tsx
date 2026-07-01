import React, { useContext, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RegisterScreen from '../Auth/RegisterScreen';
import LoginScreen from '../Auth/LoginScreen';
import ForgotPasswordScreen from '../Auth/ForgotPasswordScreen';
import PrivacyScreen from '../onboarding/PrivacyScreen';
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
import OtpVerificationScreen from '../Auth/OtpVerificationScreen';

const Stack = createNativeStackNavigator();

const Routes = () => {
  const { initialScreen, setInitialScreen } = useContext(AppContext);
  useEffect(() => {
    const checkStatus = async () => {
      const isRegistered = await AsyncStorage.getItem('isRegistered');
      const entryHomeScreen = await AsyncStorage.getItem('entryHomeScreen');
      const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');

      if (isLoggedIn === 'true' || entryHomeScreen === 'true') {
        setInitialScreen('BottomTabs');
        return;
      }

      if (isRegistered === 'true') {
        setInitialScreen('Privacy');
        return;
      }

      setInitialScreen('Register');
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
        <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} />
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

