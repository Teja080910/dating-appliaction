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
import { colors, radius } from '../../constants/theme';

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

  const refreshImages = async () => {
    const userData = await AuthStorage.getUser();
    const uid = userData?.userId;
    if (uid) {
      try {
        const allImagesResp = await profileApi.getAllImages(uid);
        const imageList = parseImageList(allImagesResp);
        if (imageList.length > 0) {
          const urls = imageList.map((img: any) => resolveImageUri(img.imageUrl || img.url || img));
          const ids = imageList.map((img: any) => img.id);
          setImages(urls);
          setImageIds(ids);
          const profileImg = imageList.find((img: any) => img.profile);
          if (profileImg) {
            setProfileImage(resolveImageUri(profileImg.imageUrl));
          }
        }
      } catch {}
    }
  };

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

      Alert.alert('Delete Photo', 'Are you sure you want to delete this photo?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (currentImageId) {
              try {
                await profileApi.deleteImage(currentImageId);
              } catch (err: any) {
                Alert.alert(
                  'Error',
                  err?.response?.data?.message || 'Failed to delete photo. Please try again.',
                );
                return;
              }
            }
            const newImages = [...images];
            newImages[index] = null;
            setImages(newImages);
            const newImageIds = [...(imageIds || [])];
            newImageIds[index] = null;
            setImageIds(newImageIds);
            if (profileImage === currentImage) {
              setProfileImage(null);
            }
            await refreshImages();
          },
        },
      ]);
    } else {
      const result = await launchImageLibrary({ mediaType: 'photo' });

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const uri = asset.uri;
        if (uri) {
          setUploadingIndex(index);
          try {
            const userData = await AuthStorage.getUser();
            const uid = userData?.userId;
            if (uid) {
              await profileApi.uploadImage(uid, {
                uri,
                type: asset.type || 'image/jpeg',
                fileName: asset.fileName || 'photo.jpg',
              });
              await refreshImages();
              if (totalImages === 0) {
                const allImagesResp = await profileApi.getAllImages(uid);
                const imageList = parseImageList(allImagesResp);
                if (imageList.length > 0) {
                  const lastImg = imageList[imageList.length - 1];
                  try {
                    await profileApi.setProfilePhoto(uid, lastImg.id);
                  } catch {}
                }
              }
            }
          } catch (e: any) {
            Alert.alert('Upload failed', e?.response?.data?.message || e?.message || 'Please try again');
          } finally {
            setUploadingIndex(null);
          }
        }
      }
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
                <ActivityIndicator size="large" color={colors.primary} />
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
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 14,
    paddingHorizontal: 20,
    paddingTop: 8,
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    gap: 10,
  },
  imageBox: {
    width: 108,
    height: 108,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    borderRadius: radius.lg,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    fontSize: 28,
    color: colors.inkFaint,
  },
  plusBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  plusText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
