import React, { useContext, useEffect } from 'react';
import { ActivityIndicator, DeviceEventEmitter, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RegisterScreen from '../Auth/RegisterScreen';
import LoginScreen from '../Auth/LoginScreen';
import ForgotPasswordScreen from '../Auth/ForgotPasswordScreen';
import OTPScreen from '../Auth/OTPScreen';
import PrivacyScreen from '../onboarding/PrivacyScreen';
import DisplayNameScreen from '../onboarding/DisplayNameScreen';
import GenderOrientationScreen from '../onboarding/GenderOrientationScreen';
import DOBScreen from '../onboarding/DOBScreen';
import AppContext from '../../context/CreateGlobalStateContext';
import UploadImageScreen from '../onboarding/UploadImageScreen';
import SelfieVerificationScreen from '../onboarding/SelfieVerificationScreen';
import BottomTabs from './BottomTabs';
import AboutProfileScreen from '../onboarding/AboutProfileScreen';
import ConnectTelegramScreen from '../onboarding/ConnectTelegramScreen';
import SearchScreen from '../SearchSettings/SearchScreen';
import ProfileSettingsScreen from '../ProfileTab/ProfileSettingsScreen';
import ViewMyProfileScreen from '../ProfileTab/ViewMyProfileScreen';
import MatchScreen from '../HomeTab/MatchScreen';
import PrivacyPolicyScreen from '../ProfileTab/PrivacyPolicyScreen';
import ChatDetailScreen from '../MessageTab/ChatDetailScreen';
import MoreDetailsScreen from '../onboarding/MoreDetailsScreen';
import SupportScreen from '../ProfileTab/SupportScreen';
import NotificationsScreen from '../ProfileTab/NotificationsScreen';
import { SESSION_EXPIRED_EVENT } from '../../api/apiClient';
import { resolveInitialRoute } from '../../utils/session';
import SubscriptionModal from '../../components/SubscriptionModal';
import { Colors } from '../../theme';


const Stack = createNativeStackNavigator();

const Routes = () => {
  const {
    initialScreen,
    setInitialScreen,
    paywallVisible,
    setPaywallVisible,
  } = useContext(AppContext);

  useEffect(() => {
    // Listener for global session expiry
    const subscription = DeviceEventEmitter.addListener(SESSION_EXPIRED_EVENT, () => {
      console.log('Routes: Session expired event received');
      setInitialScreen('Login');
    });

    return () => {
      subscription.remove();
    };
  }, [setInitialScreen]);

  useEffect(() => {
    const checkStatus = async () => {
      let fallbackTriggered = false;
      const fallbackTimer = setTimeout(() => {
        fallbackTriggered = true;
        setInitialScreen('Login');
      }, 3500);

      try {
        const nextRoute = await resolveInitialRoute();
        if (!fallbackTriggered) {
          clearTimeout(fallbackTimer);
          setInitialScreen(nextRoute);
        }
      } catch (error) {
        console.error('Error checking status:', error);
        clearTimeout(fallbackTimer);
        setInitialScreen('Login');
      }
    };
    checkStatus();
  }, [setInitialScreen]);

  if (!initialScreen) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#FF5A79" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        key={initialScreen}
        initialRouteName={initialScreen}
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      >
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="OTPScreen" component={OTPScreen} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} />
        <Stack.Screen name="DisplayName" component={DisplayNameScreen} />
        <Stack.Screen name="GenderOrientation" component={GenderOrientationScreen} />
        <Stack.Screen name="DOB" component={DOBScreen} />
        <Stack.Screen name="UploadImage" component={UploadImageScreen} />
        <Stack.Screen name="SelfieVerification" component={SelfieVerificationScreen} />
        <Stack.Screen name="BottomTabs" component={BottomTabs} />
        <Stack.Screen name="AboutProfile" component={AboutProfileScreen} />
        <Stack.Screen name="ConnectTelegram" component={ConnectTelegramScreen} />
        <Stack.Screen name="SearchSettings" component={SearchScreen} />
        <Stack.Screen name="ProfileSettingsScreen" component={ProfileSettingsScreen} />
        <Stack.Screen name="ViewMyProfileScreen" component={ViewMyProfileScreen} />
        <Stack.Screen name="MatchScreen" component={MatchScreen} />
        <Stack.Screen name="ChatDetailScreen" component={ChatDetailScreen} />
        <Stack.Screen name="MoreDetails" component={MoreDetailsScreen} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        <Stack.Screen name="SupportScreen" component={SupportScreen} />
        <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} />
      </Stack.Navigator>
      <SubscriptionModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
      />
    </NavigationContainer>
  );
};

export default Routes;

const styles = {
  loadingScreen: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.background,
  },
};


