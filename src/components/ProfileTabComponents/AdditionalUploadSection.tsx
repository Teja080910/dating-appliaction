import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
} from 'react-native';
import React, { useContext, useState } from 'react';
import AuthImage from '../AuthImage';
import AppContext from '../../context/CreateGlobalStateContext';
import PhotoVerifiedBadge from './PhotoVerifiedBadge';
import { launchImageLibrary } from 'react-native-image-picker';
import { profileApi } from '../../api/profileApi';
import { AuthStorage } from '../../api/authStorage';
import { resolveImageUri, parseImageList } from '../../utils/imageUtils';

const AdditionalUploadSection = () => {
  const {
    images,
    imageIds,
    setImageIds,
    profileImage,
    setProfileImage,
    setSelectedIndex,
    setIsModalVisible,
    setImages,
  } = useContext(AppContext);

  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const onPressImage = async (index: number) => {
    const currentImage = images[index];
    const currentImageId = imageIds?.[index];

    const totalImages = images.filter((img: string | null) => !!img).length;

    if (currentImage && currentImage.trim() !== '') {
      if (totalImages === 1) {
        Alert.alert(
          'Hold on!',
          "At least one photo must remain. You can't remove your only profile picture."
        );
        return;
      }

      const newImages = [...images];
      newImages[index] = null;
      setImages(newImages);

      if (currentImageId) {
        try {
          await profileApi.deleteImage(currentImageId);
        } catch {}
      }
      const newImageIds = [...(imageIds || [])];
      newImageIds[index] = null;
      setImageIds(newImageIds);

      if (profileImage === currentImage) {
        setProfileImage(null);
      }

      setSelectedIndex(null);
      setIsModalVisible(false);
    } else {
      const result = await launchImageLibrary({ mediaType: 'photo' });

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const uri = asset.uri;
        if (uri) {
          setUploadingIndex(index);
          const updatedImages = [...images];
          updatedImages[index] = uri;
          setImages(updatedImages);

          if (!profileImage) {
            setProfileImage(uri);
          }

          try {
            const userIdStr = await AuthStorage.getUserIdStr();
            if (userIdStr) {
              await profileApi.uploadImage(userIdStr, {
                uri,
                type: asset.type || 'image/jpeg',
                fileName: asset.fileName || 'photo.jpg',
              });

              const allImagesResp = await profileApi.getAllImages(userIdStr);
              const imageList = parseImageList(allImagesResp);
              if (imageList.length > 0) {
                const newImageIds = [...(imageIds || [])];
                const lastImg = imageList[imageList.length - 1];
                newImageIds[index] = lastImg.id;
                setImageIds(newImageIds);

                const backendUrl = resolveImageUri(lastImg.imageUrl || '');
                if (backendUrl) {
                  updatedImages[index] = backendUrl;
                  setImages([...updatedImages]);
                  if (totalImages === 0) {
                    setProfileImage(backendUrl);
                  }
                }

                try {
                  await profileApi.setProfilePhoto(userIdStr, lastImg.id);
                } catch {}
              }
            }
          } catch (e: any) {
            Alert.alert('Upload failed', e?.response?.data?.message || e?.message || 'Please try again');
            updatedImages[index] = null;
            setImages([...updatedImages]);
          } finally {
            setUploadingIndex(null);
          }
        }
      }

      setIsModalVisible(false);
    }
  };

  return (
    <View>
      <Text style={styles.textPhoto}>PHOTOS</Text>

      <View style={styles.grid}>
        {Array.from({ length: 6 }).map((_, i) => {
          const imageUri = images[i];

          return (
            <TouchableOpacity
              key={i}
              style={styles.imageBox}
              onPress={() => onPressImage(i)}
              disabled={uploadingIndex !== null}
            >
              {uploadingIndex === i ? (
                <ActivityIndicator size="large" color="#D94B58" />
              ) : imageUri ? (
                <AuthImage uri={imageUri} style={styles.uploadedImage} />
              ) : (
                <View style={styles.iconContainer}>
                  <Text style={styles.cameraIcon}>📷</Text>
                  <View style={styles.plusBadge}>
                    <Text style={styles.plusText}>+</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        <PhotoVerifiedBadge />
      </View>
    </View>
  );
};

export default AdditionalUploadSection;

const styles = StyleSheet.create({
  textPhoto: {
    fontSize: 13,
    fontWeight: '600',
    color: '#a0a0a0',
    marginBottom: 10,
    padding: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 10,
  },
  imageBox: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    overflow: 'hidden',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  cameraIcon: {
    fontSize: 28,
    color: '#333',
  },
  plusBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#d63d4c',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
