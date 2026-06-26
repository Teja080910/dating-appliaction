import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Feather';
import { mapImagesToSlots, useUserImages } from '../../api/useImages';
import AppContext from '../../context/CreateGlobalStateContext';
import { Colors } from '../../theme';
import { getAuthSession, isResolvedApiUserId } from '../../utils/session';
import PhotoVerifiedBadge from './PhotoVerifiedBadge';
import { useAlert } from '../AlertModal';

const AdditionalUploadSection = () => {
  const { alert, AlertComponent } = useAlert();
  const {
    images,
    setProfileImage,
    setProfileImageUrl,
    setImages,
    authUserId,
    setAuthUserId,
  } = useContext(AppContext);

  const { uploadImage, getAllImages, deleteImage, setProfilePhoto } = useUserImages();
  const [localUserId, setLocalUserId] = useState<string | null>(null);
  const [imageMap, setImageMap] = useState<Record<number, number>>({}); // index -> imageId

  const resolveActiveUserId = useCallback(async () => {
    if (authUserId && isResolvedApiUserId(authUserId)) {
      return String(authUserId);
    }

    const authSession = await getAuthSession();
    if (authSession?.userId && isResolvedApiUserId(authSession.userId)) {
      return String(authSession.userId);
    }

    return null;
  }, [authUserId]);

  const syncImagesFromServer = useCallback((uid?: string | null) => {
    getAllImages.mutate(uid || undefined, {
      onSuccess: (data: any) => {
        const mapped = mapImagesToSlots(data);
        setImages(mapped.slots);
        setImageMap(mapped.imageIdByIndex);
        setProfileImage(mapped.profileImageUrl);
        setProfileImageUrl(mapped.profileImageUrl);
      },
      onError: (error: any) => {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          'Unable to sync your images right now.';
              alert('Error', String(message));
      },
    });
  }, [getAllImages, setImages, setProfileImage, setProfileImageUrl]);

  useEffect(() => {
    const init = async () => {
      const uid = await resolveActiveUserId();
      if (uid) {
        const uidStr = uid.toString();
        setLocalUserId(uidStr);
        setAuthUserId?.(uidStr);
        syncImagesFromServer(uidStr);
        return;
      }

      syncImagesFromServer();
    };
    init().catch(() => null);
  }, [resolveActiveUserId, setAuthUserId, syncImagesFromServer]);

  const onPressImage = async (index: number) => {
    const currentImage = images[index];
    const imageId = imageMap[index];

    if (currentImage && currentImage.trim() !== '') {
      // REMOVE CASE
      alert('Remove Photo', 'Are you sure you want to remove this photo?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            if (imageId) {
              deleteImage.mutate(imageId, {
                onSuccess: () => {
                  syncImagesFromServer(localUserId);
                },
                onError: () => alert('Error', 'Failed to delete image from server.'),
              });
            } else {
              const newImages = [...images];
              newImages[index] = null;
              setImages(newImages);
            }
          },
        },
      ]);
    } else {
      // UPLOAD CASE
      const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.uri) {
          uploadImage.mutate({
            uid: localUserId || undefined,
            photo: {
              uri: asset.uri,
              fileName: asset.fileName || `upload_${Date.now()}.jpg`,
              type: asset.type || 'image/jpeg',
            },
          }, {
            onSuccess: async (response: any) => {
              const uploadedImageId =
                typeof response?.id === 'number'
                  ? response.id
                  : typeof response?.data?.id === 'number'
                    ? response.data.id
                    : null;

              if (index === 0 && uploadedImageId && localUserId) {
                try {
                  await setProfilePhoto.mutateAsync({
                    uid: localUserId,
                    imageId: uploadedImageId,
                  });
                } catch { }
              }

              syncImagesFromServer(localUserId);
            },
            onError: (error: any) => {
              const message =
                error?.response?.data?.message ||
                error?.message ||
                'Failed to upload image to server.';
        alert('Error', String(message));
            },
          });
        }
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.textPhoto}>PHOTOS</Text>

      <View style={styles.grid}>
        {Array.from({ length: 6 }).map((_, i) => {
          const imageUri = images[i];
          const isProcessing = (uploadImage.isPending || deleteImage.isPending || getAllImages.isPending);

          return (
            <TouchableOpacity
              key={i}
              style={styles.imageBox}
              onPress={() => onPressImage(i)}
              disabled={isProcessing}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.uploadedImage} />
              ) : (
                <View style={styles.iconContainer}>
                  {uploadImage.isPending ? (
                    <ActivityIndicator color="#E94057" />
                  ) : (
                    <>
                      <Icon name="camera" size={24} color="#777" />
                      <View style={styles.plusBadge}>
                        <Icon name="plus" size={12} color="#fff" />
                      </View>
                    </>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.badgeWrapper}>
        <PhotoVerifiedBadge />
      </View>
      {AlertComponent}
    </View>
  );
};

export default AdditionalUploadSection;

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  textPhoto: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 10,
    padding: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  imageBox: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: Colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    margin: '1.5%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.glass,
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  plusBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surface,
  },
  badgeWrapper: {
    alignItems: 'center',
    marginTop: 20,
  },
});
