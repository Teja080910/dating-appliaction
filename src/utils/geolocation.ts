import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid, Platform } from 'react-native';
import { t } from '../i18n';

export const checkLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    return true;
  }

  if (Platform.OS === 'android') {
    try {
      const fine = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      const coarse = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      );
      return fine || coarse;
    } catch {
      return false;
    }
  }
  return true;
};

export const requestLocationPermission = async () => {
  if (Platform.OS === 'ios') {
    try {
      const auth = await Geolocation.requestAuthorization('whenInUse');
      return auth === 'granted';
    } catch {
      return false;
    }
  }

  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: t('common.geolocation.location_permission'),
          message: t('common.geolocation.this_app_needs_access_to_your_location_to_find_nearby_matches'),
          buttonNeutral: 'Ask Me Later',
          buttonNegative: t('profile.additionaluploadsection.cancel'),
          buttonPositive: t('profile.profilesettingsscreen.ok'),
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  return false;
};

export const getCurrentLocation = (
  promptUser = false
): Promise<{ latitude: number; longitude: number }> => {
  return new Promise(async (resolve, reject) => {
    if (promptUser) {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        reject(new Error('Location permission not granted'));
        return;
      }
    }

    Geolocation.getCurrentPosition(
      (position: any) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error: any) => {
        reject(error);
      },
      {
        enableHighAccuracy: promptUser,
        timeout: promptUser ? 15000 : 5000,
        maximumAge: promptUser ? 10000 : 60000,
        showLocationDialog: promptUser,
        forceRequestLocation: promptUser,
      }
    );
  });
};
