import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Feather';
import { getAbsoluteUrl, isApiHostedUrl } from '../../api/apiClient';
import { getAuthToken } from '../../utils/sessionHelper';
import { mapImagesToSlots, useUserImages } from '../../api/useImages';
import AppContext from '../../context/CreateGlobalStateContext';
import { Colors } from '../../theme';
import { getAuthSession, isResolvedApiUserId } from '../../utils/session';
import PhotoVerifiedBadge from './PhotoVerifiedBadge';
import { useAlert } from '../AlertModal';

const TOTAL_SLOTS = 6;

const AdditionalUploadSection = () => {
  const { alert, AlertComponent } = useAlert();
  const {
    images,
    profileImage,
    profileImageUrl,
    setProfileImage,
    setProfileImageUrl,
    setImages,
    authUserId,
    setAuthUserId,
  } = useContext(AppContext);

  const { uploadImage, getAllImages, deleteImage, setProfilePhoto } = useUserImages();
  const [localUserId, setLocalUserId] = useState<string | null>(null);
  const [imageMap, setImageMap] = useState<Record<number, number>>({}); // index -> imageId
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [tokenReady, setTokenReady] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});

  const hasSyncedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    getAuthToken()
      .then((token) => {
        if (isMounted) {
          setAuthToken(token);
          setTokenReady(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAuthToken(null);
          setTokenReady(true);
        }
      });
    return () => { isMounted = false; };
  }, []);

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
        const mapped = mapImagesToSlots(data, TOTAL_SLOTS);
        const resolvedSlots = [...mapped.slots];

        // If slot 0 is empty but we have a profileImageUrl in context/response, use it
        if (!resolvedSlots[0] && mapped.profileImageUrl) {
          resolvedSlots[0] = mapped.profileImageUrl;
        }

        if (resolvedSlots.some(Boolean)) {
          setImages(resolvedSlots);
          setImageMap(mapped.imageIdByIndex);
          if (mapped.profileImageUrl) {
            setProfileImage(mapped.profileImageUrl);
            setProfileImageUrl(mapped.profileImageUrl);
          }
        }
      },
      onError: (error: any) => {
        console.warn('[AdditionalUploadSection] Image sync warning:', error?.message);
      },
    });
  }, [getAllImages, setImages, setProfileImage, setProfileImageUrl]);

  useEffect(() => {
    if (hasSyncedRef.current) return;
    hasSyncedRef.current = true;

    const init = async () => {
      const token = await getAuthToken();
      if (token) {
        setAuthToken(token);
        setTokenReady(true);
      }

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
      alert('Photo Options', 'What would you like to do with this photo?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove Photo',
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
      setUploadingSlot(index);
      try {
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
                setUploadingSlot(null);
              },
              onError: (error: any) => {
                setUploadingSlot(null);
                const message =
                  error?.response?.data?.message ||
                  error?.message ||
                  'Failed to upload image to server.';
                alert('Error', String(message));
              },
            });
            return;
          }
        }
      } catch (err: any) {
        console.warn('Image pick error:', err);
      }
      setUploadingSlot(null);
    }
  };

  const getImageSource = (uri: string | null | undefined): ImageSourcePropType | null => {
    if (!uri || typeof uri !== 'string' || !uri.trim()) return null;
    const absUrl = getAbsoluteUrl(uri.trim());
    const isApi = isApiHostedUrl(absUrl);
    if (isApi) {
      const headers: Record<string, string> = {
        'ngrok-skip-browser-warning': '69420',
        'User-Agent': 'AMARA-App',
      };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }
      return {
        uri: absUrl,
        headers,
      };
    }
    return { uri: absUrl };
  };

  return (
    <View style={styles.container}>
      <Text style={styles.textPhoto}>PHOTOS</Text>

      <View style={styles.grid}>
        {Array.from({ length: TOTAL_SLOTS }).map((_, i) => {
          const imageUri = images?.[i];
          const isFailed = Boolean(failedImages[i]);
          const isSlotUploading = uploadImage.isPending && uploadingSlot === i;
          const isProcessing = uploadImage.isPending || deleteImage.isPending || getAllImages.isPending;
          const imageSource = !isFailed && imageUri ? getImageSource(imageUri) : null;

          return (
            <TouchableOpacity
              key={`slot-${i}-${imageUri || 'empty'}-${tokenReady}`}
              style={styles.imageBox}
              onPress={() => onPressImage(i)}
              disabled={isProcessing}
              activeOpacity={0.8}>
              {imageSource ? (
                <>
                  <Image
                    source={imageSource}
                    style={styles.uploadedImage}
                    resizeMode="cover"
                    onError={(err) => {
                      console.warn(`[AdditionalUploadSection] Failed to load image at index ${i}:`, err.nativeEvent);
                      setFailedImages((prev) => ({ ...prev, [i]: true }));
                    }}
                  />
                  <TouchableOpacity
                    style={styles.deleteBadge}
                    onPress={() => onPressImage(i)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Icon name="x" size={11} color={Colors.white} />
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.iconContainer}>
                  {isSlotUploading ? (
                    <ActivityIndicator color={Colors.primary} size="small" />
                  ) : (
                    <>
                      <Icon name="camera" size={24} color={Colors.textMuted} />
                      <View style={styles.plusBadge}>
                        <Icon name="plus" size={12} color={Colors.white} />
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
    position: 'relative',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  deleteBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
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

