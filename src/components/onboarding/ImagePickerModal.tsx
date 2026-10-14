import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {requestPermissions} from '../../utils/types/permission';
import { useAlert } from '../AlertModal';

import { t } from '../../i18n';
export const handleImagePick = async (
  alert: (title: string, message?: string, buttons?: any[]) => void,
  type: 'camera' | 'gallery',
  selectedIndex: number | null,
  images: (string | null)[],
  setImages: (images: (string | null)[]) => void,
  setIsModalVisible: (visible: boolean) => void,
  profileImage: string | null,
  setProfileImage: (uri: string | null) => void,
) => {
  const hasPermission = await requestPermissions();
  if (!hasPermission) {
    alert(
      t('onboarding.imagepickermodal.permission_denied'),
      t('onboarding.imagepickermodal.you_need_to_grant_permission_to_use_this_feature'),
    );
    return;
  }

  const options = {mediaType: 'photo' as const, quality: 1 as const};

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
        console.log('Selected index:', selectedIndex);
        console.log('Updated images array:', newImages);
        setImages(newImages);
        if (!profileImage) {
          console.log('Setting profile image:', uri);
          
          setProfileImage(uri);
        }
      }
    } else if (result.errorMessage) {
      alert(t('profile.additionaluploadsection.error'), result.errorMessage);
    }
  } catch (error) {
    console.error(error);
    alert(t('profile.additionaluploadsection.error'), t('onboarding.imagepickermodal.something_went_wrong'));
  } finally {
    setIsModalVisible(false);
  }
};

