import { PermissionsAndroid, Platform } from 'react-native';

export const requestPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const cameraGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA
      );

      let mediaPermission;
      if (Platform.Version >= 33) {
        mediaPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
        );
      } else {
        mediaPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
        );
      }

      return (
        cameraGranted === PermissionsAndroid.RESULTS.GRANTED &&
        mediaPermission === PermissionsAndroid.RESULTS.GRANTED
      );
    } catch (err) {
      console.warn(err);
      return false;
    }
  } else {
    return true; 
  }
};
