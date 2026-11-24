/**
 * @format
 */
import './src/theme/globalFontScaler';
import 'react-native-gesture-handler';

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// Safe background push notification handler (FCM)
try {
  const messagingModule = require('@react-native-firebase/messaging');
  const messaging = messagingModule.default || messagingModule;
  if (messaging && typeof messaging === 'function') {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      if (__DEV__) {
        console.log('[Push] Background push message received:', remoteMessage);
      }
    });
  }
} catch (e) {
  // Gracefully ignored when native Firebase module or google-services.json is pending
}

AppRegistry.registerComponent(appName, () => App);
