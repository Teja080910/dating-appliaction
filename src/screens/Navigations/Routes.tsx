// import React, { useEffect, useState } from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import RegisterScreen from '../RegisterScreen';
// import LoginScreen from '../LoginScreen';
// import ForgotPasswordScreen from '../ForgotPasswordScreen';
// import PrivacyScreen from '../PrivacyScreen';
// import HomeScreen from '../HomeScreen';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const Stack = createNativeStackNavigator();

// const Routes = () => {
//   const [initialScreen, setInitialScreen] = useState<string | null>(null);
//   useEffect(() => {
//     const checkTerms = async () => {
//       const accepted = await AsyncStorage.getItem('acceptedTerms');
//       console.log('Accepted Terms:', accepted);
      
//       setInitialScreen(accepted === 'true' ? 'Home' : 'Privacy');
//     };
//     checkTerms();
//   }, []);

//   if (!initialScreen) return null; 
//   return (
//     <NavigationContainer>
//       <Stack.Navigator screenOptions={{ headerShown: false }}>
//         {initialScreen === 'Privacy' && (
//           <>
//             <Stack.Screen name="Register" component={RegisterScreen} />
//             <Stack.Screen name="Privacy" component={PrivacyScreen} />
//           </>
//         )}
//         {/* <Stack.Screen
//           name="Register"
//           component={RegisterScreen}
//           options={{ headerShown: false }}
//         /> */}
//         <Stack.Screen 
//         name="Login" 
//         component={LoginScreen} 
//         options={{ headerShown: false }}
//         />
//         <Stack.Screen 
//         name="Forgot Password" 
//         component={ForgotPasswordScreen} 
//         options={{ headerShown: false }}
//         />
//         {/* <Stack.Screen 
//         name="Privacy" 
//         component={PrivacyScreen} 
//         options={{ headerShown: false }}
//         /> */}
//         <Stack.Screen 
//         name="Home" 
//         component={HomeScreen} 
//         options={{ headerShown: false }}
//         />
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// };

// export default Routes;













// import React, { useEffect, useState } from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import RegisterScreen from '../RegisterScreen';
// import LoginScreen from '../LoginScreen';
// import ForgotPasswordScreen from '../ForgotPasswordScreen';
// import PrivacyScreen from '../PrivacyScreen';
// import HomeScreen from '../HomeScreen';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const Stack = createNativeStackNavigator();

// const Routes = () => {
//   const [initialScreen, setInitialScreen] = useState<string | null>(null);

//   useEffect(() => {
//     const checkTerms = async () => {
//       const accepted = await AsyncStorage.getItem('acceptedTerms');
//       console.log('Accepted Terms:', accepted);

//       setInitialScreen(accepted === 'true' ? 'Home' : 'Privacy');
//     };
//     checkTerms();
//   }, []);

//   if (!initialScreen) return null;

//   return (
//     <NavigationContainer>
//       <Stack.Navigator initialRouteName={initialScreen} screenOptions={{ headerShown: false }}>
//         <Stack.Screen name="Register" component={RegisterScreen} />
//         <Stack.Screen name="Login" component={LoginScreen} />
//         <Stack.Screen name="Forgot Password" component={ForgotPasswordScreen} />
//         <Stack.Screen name="Privacy" component={PrivacyScreen} />
//         <Stack.Screen name="Home" component={HomeScreen} />
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// };

// export default Routes















// import AsyncStorage from '@react-native-async-storage/async-storage';
// import React, { useEffect, useState } from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import RegisterScreen from '../RegisterScreen';
// import PrivacyScreen from '../PrivacyScreen';
// import HomeScreen from '../HomeScreen'; // 👈 Your actual app screen

// const Stack = createNativeStackNavigator();

// const Routes = () => {
//   const [initialScreen, setInitialScreen] = useState<string | null>(null);

//   useEffect(() => {
//     const checkTerms = async () => {
//       const accepted = await AsyncStorage.getItem('acceptedTerms');
//       console.log('Accepted Terms:', accepted);
      
//       setInitialScreen(accepted === 'true' ? 'Home' : 'Privacy');
//     };
//     checkTerms();
//   }, []);

//   if (!initialScreen) return null; // or splash loader

//   return (
//     <NavigationContainer>
//       <Stack.Navigator screenOptions={{ headerShown: false }}>
//         {initialScreen === 'Privacy' && (
//           <>
//             <Stack.Screen name="Register" component={RegisterScreen} />
//             <Stack.Screen name="Privacy" component={PrivacyScreen} />
//           </>
//         )}
//         <Stack.Screen name="Home" component={HomeScreen} />
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// };

// export default Routes;












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
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Routes;

