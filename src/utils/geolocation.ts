import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid, Platform } from 'react-native';

export const requestLocationPermission = async () => {
  if (Platform.OS === 'ios') {
    Geolocation.requestAuthorization('whenInUse');
    return true;
  }

  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your location to find nearby matches.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      } else {
        console.log('Location permission denied');
        return false;
      }
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
};

export const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
  return new Promise(async (resolve, reject) => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      reject(new Error('Location permission not granted'));
      return;
    }

    Geolocation.getCurrentPosition(
      (position: any) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error: any) => {
        console.error('Error getting location:', error);
        reject(error);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  });
};
