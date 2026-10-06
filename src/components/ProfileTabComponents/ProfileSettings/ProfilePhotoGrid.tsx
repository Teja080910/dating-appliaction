import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAbsoluteUrl, isApiHostedUrl } from '../../../api/apiClient';
import { mapImagesToSlots, useUserImages } from '../../../api/useImages';
import { useProfile } from '../../../api/useProfile';
import AppContext from '../../../context/CreateGlobalStateContext';
import { Colors, useTheme } from '../../../theme';
import { getAuthSession, isResolvedApiUserId } from '../../../utils/session';
import { getAuthToken } from '../../../utils/sessionHelper';
import { useAlert } from '../../AlertModal';

const TOTAL_SLOTS = 6;

const ProfilePhotoGrid = () => {
  const { themeColors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const { alert } = useAlert();
  const {
    images,
    setImages,
    setProfileImage,
    setProfileImageUrl,
    authUserId,
    setAuthUserId,
  } = useContext(AppContext);

  const { uploadImage, getAllImages, deleteImage } = useUserImages();
  const { updateProfile } = useProfile();
  const [imageMap, setImageMap] = useState<Record<number, number>>({});
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [localUserId, setLocalUserId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getAuthToken()
      .then((token) => {
        if (isMounted) setAuthToken(token);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
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

  const syncImages = useCallback((uid?: string | null) => {
    getAllImages.mutate(uid || undefined, {
      onSuccess: (data: any) => {
        const mapped = mapImagesToSlots(data, TOTAL_SLOTS);
        const resolvedSlots = [...mapped.slots];
        while (resolvedSlots.length < TOTAL_SLOTS) {
          resolvedSlots.push(null);
        }
        setImages(resolvedSlots);
        setImageMap(mapped.imageIdByIndex);
        if (mapped.profileImageUrl) {
          setProfileImage(mapped.profileImageUrl);
          setProfileImageUrl(mapped.profileImageUrl);
        }
      },
    });
  }, [getAllImages, setImages, setProfileImage, setProfileImageUrl]);

  useEffect(() => {
    const init = async () => {
      const uid = await resolveActiveUserId();
      if (uid) {
        setLocalUserId(uid);
        setAuthUserId?.(uid);
        syncImages(uid);
      } else {
        syncImages();
      }
    };
    void init();
  }, [resolveActiveUserId, setAuthUserId, syncImages]);

  const handlePickImage = async (index: number) => {
    try {
      const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.uri) {
          setUploadingSlot(index);
          uploadImage.mutate(
            {
              uid: localUserId || undefined,
              photo: {
                uri: asset.uri,
                fileName: asset.fileName || `photo_${Date.now()}.jpg`,
                type: asset.type || 'image/jpeg',
              },
            },
            {
              onSuccess: () => {
                syncImages(localUserId);
              },
              onError: (err) => {
                console.error('Image upload failed:', err);
                alert('Upload failed', 'Failed to upload image. Please try again.');
              },
              onSettled: () => {
                setUploadingSlot(null);
              },
            }
          );
        }
      }
    } catch (e) {
      setUploadingSlot(null);
    }
  };

  const handleDeleteImage = async (index: number) => {
    const imageId = imageMap[index];
    const currentList = [...(images || [])];

    // 1. Instant optimistic update: filter out deleted image and shift remaining forward
    const remainingPhotos = currentList.filter((item, i) => i !== index && Boolean(item));
    const nextSlots: (string | null)[] = [...remainingPhotos];
    while (nextSlots.length < TOTAL_SLOTS) {
      nextSlots.push(null);
    }
    setImages(nextSlots);

    // 2. Update primary profile photo in context
    const newPrimary = nextSlots.find(Boolean) || null;
    setProfileImage(newPrimary);
    setProfileImageUrl(newPrimary);

    // 3. Persist to AsyncStorage immediately
    try {
      await AsyncStorage.setItem('onboardingImages', JSON.stringify(nextSlots));
      if (newPrimary) {
        await AsyncStorage.setItem('profileImage', newPrimary);
      } else {
        await AsyncStorage.removeItem('profileImage');
      }
    } catch {}

    // 4. Update imageMap slot indices
    setImageMap((prev) => {
      const updated: Record<number, number> = {};
      let nextIdx = 0;
      for (let i = 0; i < currentList.length; i++) {
        if (i !== index && currentList[i] && prev[i]) {
          updated[nextIdx] = prev[i];
          nextIdx++;
        }
      }
      return updated;
    });

    // 5. Delete on server if image ID is present
    if (imageId) {
      deleteImage.mutate(imageId, {
        onSuccess: () => {
          syncImages(localUserId);
        },
        onError: (err) => {
          console.warn('Delete image server error:', err);
        },
      });
    }

    // 6. Synchronize profile photos array on backend
    try {
      updateProfile.mutate(
        {
          userId: localUserId || undefined,
          photos: remainingPhotos as string[],
        },
        {
          onError: (err) => console.warn('Update profile photos sync error:', err),
        }
      );
    } catch {}
  };

  const itemWidth = Math.floor((width - 40 - 20) / 3);
  const itemHeight = Math.floor(itemWidth * 1.35);

  const displaySlots = Array.from({ length: TOTAL_SLOTS }, (_, index) => images?.[index] || null);

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {displaySlots.map((item, index) => {
          const isUploading = uploadingSlot === index;
          const uri = item ? (isApiHostedUrl(getAbsoluteUrl(item)!) ? getAbsoluteUrl(item)! : item) : null;

          if (uri) {
            return (
              <View
                key={index}
                style={[
                  styles.slot,
                  {
                    width: itemWidth,
                    height: itemHeight,
                    backgroundColor: themeColors.surfaceLight,
                  },
                ]}
              >
                <Image
                  source={{
                    uri,
                    headers: {
                      'ngrok-skip-browser-warning': '69420',
                      'User-Agent': 'AMARA-App',
                      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                    },
                  }}
                  style={styles.image}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteImage(index)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Icon name="trash-can-outline" size={17} color="#1E1A29" />
                </TouchableOpacity>
              </View>
            );
          }

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.emptySlot,
                {
                  width: itemWidth,
                  height: itemHeight,
                  backgroundColor: themeColors.surfaceLight,
                  borderColor: themeColors.borderLight,
                },
              ]}
              onPress={() => handlePickImage(index)}
              activeOpacity={0.7}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color={themeColors.primary} size="small" />
              ) : (
                <>
                  <Icon name="camera-outline" size={28} color={themeColors.textMuted} />
                  <Icon
                    name="plus"
                    size={16}
                    color={themeColors.textMuted}
                    style={styles.plusIcon}
                  />
                </>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default ProfilePhotoGrid;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slot: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  deleteButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  emptySlot: {
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  plusIcon: {
    position: 'absolute',
    bottom: 6,
    right: 6,
  },
});
