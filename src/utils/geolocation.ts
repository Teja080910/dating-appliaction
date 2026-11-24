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
      const alreadyGranted = await checkLocationPermission();
      if (alreadyGranted) {
        return true;
      }

      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ]);

      const fineGranted =
        granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
        PermissionsAndroid.RESULTS.GRANTED;
      const coarseGranted =
        granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
        PermissionsAndroid.RESULTS.GRANTED;

      return fineGranted || coarseGranted;
    } catch (err) {
      console.warn('Location permission request error:', err);
      return false;
    }
  }
  return false;
};

const fetchIpLocation = async (): Promise<{ latitude: number; longitude: number } | null> => {
  try {
    const res = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client');
    if (res.ok) {
      const data = await res.json();
      const lat = Number(data?.latitude);
      const lng = Number(data?.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)) {
        return { latitude: lat, longitude: lng };
      }
    }
  } catch {}

  try {
    const res = await fetch('https://ipapi.co/json/');
    if (res.ok) {
      const data = await res.json();
      const lat = Number(data?.latitude);
      const lng = Number(data?.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)) {
        return { latitude: lat, longitude: lng };
      }
    }
  } catch {}

  return null;
};

export const getCurrentLocation = async (
  promptUser = false
): Promise<{ latitude: number; longitude: number }> => {
  if (promptUser) {
    await requestLocationPermission().catch(() => false);
  }

  // 1. Try GPS with High Accuracy
  const tryHighAccuracy = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
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
          enableHighAccuracy: true,
          timeout: promptUser ? 8000 : 4000,
          maximumAge: 10000,
          showLocationDialog: promptUser,
          forceRequestLocation: promptUser,
        }
      );
    });
  };

  // 2. Try Coarse / Network Location (works indoors and on WiFi)
  const tryLowAccuracy = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
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
          enableHighAccuracy: false,
          timeout: 6000,
          maximumAge: 60000,
        }
      );
    });
  };

  try {
    return await tryHighAccuracy();
  } catch {
    try {
      return await tryLowAccuracy();
    } catch {
      // 3. Fallback to IP Geolocation if device GPS is off or unavailable
      const ipCoords = await fetchIpLocation();
      if (ipCoords) {
        return ipCoords;
      }
      // 4. Default fallback to Bangalore/Udayapura
      return { latitude: 12.7937, longitude: 77.5085 };
    }
  }
};
