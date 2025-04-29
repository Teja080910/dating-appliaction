import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { Alert } from 'react-native';
import { requestPermissions } from '../../utils/types/permission';

export const handleImagePick = async (
  type: 'camera' | 'gallery',
  selectedIndex: number | null,
  images: string[],
  setImages: (images: string[]) => void,
  setIsModalVisible: (visible: boolean) => void
) => {
  const hasPermission = await requestPermissions();
  if (!hasPermission) {
    Alert.alert('Permission denied', 'You need to grant permission to use this feature.');
    return;
  }

  const options = { mediaType: 'photo', quality: 1 };

  try {
    const result =
      type === 'camera'
        ? await launchCamera(options)
        : await launchImageLibrary(options);

    if (result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      if (uri && selectedIndex !== null) {
        const newImages = [...images];
        newImages[selectedIndex] = uri;
        setImages(newImages);
      }
    } else if (result.errorMessage) {
      Alert.alert('Error', result.errorMessage);
    }
  } catch (error) {
    console.error(error);
    Alert.alert('Error', 'Something went wrong');
  } finally {
    setIsModalVisible(false);
  }
};
