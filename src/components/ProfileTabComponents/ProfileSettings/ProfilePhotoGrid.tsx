import React, { useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
  Modal,
  Platform,
  DeviceEventEmitter,
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient, { getAbsoluteUrl, isApiHostedUrl } from '../../../api/apiClient';
import { mapImagesToSlots, useUserImages, NormalizedUserImage } from '../../../api/useImages';
import { useProfile } from '../../../api/useProfile';
import AppContext from '../../../context/CreateGlobalStateContext';
import { Colors, useTheme } from '../../../theme';
import { getAuthSession, isResolvedApiUserId } from '../../../utils/session';
import { getAuthToken, getUserId } from '../../../utils/sessionHelper';
import { useAlert } from '../../AlertModal';
import { requestPermissions } from '../../../utils/types/permission';
import { t, useTranslation } from '../../../i18n';

const TOTAL_SLOTS = 6;

interface ProfilePhotoGridProps {
  initialPhotos?: (string | null)[];
  userId?: string;
}

const ProfilePhotoGrid: React.FC<ProfilePhotoGridProps> = ({ initialPhotos, userId: propUserId }) => {
  useTranslation();
  const { themeColors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const { alert, AlertComponent } = useAlert();
  const {
    images,
    setImages,
    setProfileImage,
    setProfileImageUrl,
    authUserId,
    setAuthUserId,
  } = useContext(AppContext);

  const { uploadImage, getAllImages, deleteImage, setProfilePhoto } = useUserImages();
  const { updateProfile } = useProfile();
  const [imageMap, setImageMap] = useState<Record<number, number>>({});
  const [serverImages, setServerImages] = useState<NormalizedUserImage[]>([]);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [localUserId, setLocalUserId] = useState<string | null>(null);
  const [showAddPhotoModal, setShowAddPhotoModal] = useState(false);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [showFacePhotoModal, setShowFacePhotoModal] = useState(false);

  const hasUserEdited = useRef(false);
  const isInitRef = useRef(false);
  const hasHydratedFromInitial = useRef(false);
  const activeUserKeyRef = useRef<string | null>(null);
  const getAllImagesRef = useRef(getAllImages.mutate);
  getAllImagesRef.current = getAllImages.mutate;

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
    if (propUserId && isResolvedApiUserId(propUserId)) {
      return String(propUserId);
    }
    if (authUserId && isResolvedApiUserId(authUserId)) {
      return String(authUserId);
    }
    const storedUid = await getUserId().catch(() => null);
    if (storedUid && isResolvedApiUserId(storedUid)) {
      return String(storedUid);
    }
    const directUid = await AsyncStorage.getItem('userId').catch(() => null);
    if (directUid && isResolvedApiUserId(directUid)) {
      return String(directUid);
    }
    const authSession = await getAuthSession().catch(() => null);
    if (authSession?.userId && isResolvedApiUserId(authSession.userId)) {
      return String(authSession.userId);
    }
    return null;
  }, [authUserId, propUserId]);

  const getFilenameFromUrl = (u?: string | null) => {
    if (!u) return '';
    const clean = u.split('?')[0].split('#')[0];
    return clean.substring(clean.lastIndexOf('/') + 1);
  };

  const isDeletedUri = useCallback((uri: string | null | undefined, deletedList: string[]) => {
    if (!uri || !Array.isArray(deletedList) || deletedList.length === 0) return false;
    const clean = uri.trim();
    if (!clean) return false;
    const abs = getAbsoluteUrl(clean) || clean;
    const filename = getFilenameFromUrl(clean);
    const isGeneric = ['photo.jpg', 'image.jpg', 'default.jpg'].includes((filename || '').toLowerCase());

    return deletedList.some((d) => {
      if (!d) return false;
      const cleanD = String(d).trim();
      if (!cleanD) return false;
      if (cleanD === clean || cleanD === abs) return true;
      const dAbs = getAbsoluteUrl(cleanD) || cleanD;
      if (dAbs === abs || dAbs === clean) return true;
      const dFile = getFilenameFromUrl(cleanD);
      if (filename && dFile && !isGeneric && filename === dFile) return true;
      return false;
    });
  }, []);

  const getDeletedUris = useCallback(async (activeUid?: string | null) => {
    try {
      const key = activeUid ? `deleted_photos_${activeUid}` : 'deleted_image_uris';
      const raw = await AsyncStorage.getItem(key);
      const list: string[] = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }, []);

  const recordDeletedUri = useCallback(async (uri: string | null | undefined, activeUid?: string | null) => {
    if (!uri) return;
    try {
      const key = activeUid ? `deleted_photos_${activeUid}` : 'deleted_image_uris';
      const raw = await AsyncStorage.getItem(key);
      const list: string[] = raw ? JSON.parse(raw) : [];
      const abs = getAbsoluteUrl(uri);
      const filename = getFilenameFromUrl(uri);
      const isGeneric = ['photo.jpg', 'image.jpg', 'default.jpg'].includes((filename || '').toLowerCase());

      if (!list.includes(uri)) list.push(uri);
      if (abs && !list.includes(abs)) list.push(abs);
      if (filename && !isGeneric && !list.includes(filename)) list.push(filename);
      await AsyncStorage.setItem(key, JSON.stringify(list));
    } catch {}
  }, []);

  // Reset hydration and edits when switching users
  useEffect(() => {
    const currentUid = propUserId ? String(propUserId).trim() : null;
    const prevUid = activeUserKeyRef.current ? String(activeUserKeyRef.current).trim() : null;
    if (currentUid && prevUid && prevUid !== currentUid) {
      hasHydratedFromInitial.current = false;
      hasUserEdited.current = false;
      isInitRef.current = false;
    }
    if (currentUid) {
      activeUserKeyRef.current = currentUid;
    }
  }, [propUserId]);

  // Hydrate from initialPhotos (profileQuery / server data) if user hasn't edited
  useEffect(() => {
    if (hasUserEdited.current) return;
    if (initialPhotos && initialPhotos.some(Boolean)) {
      void (async () => {
        const uid = localUserId || (await resolveActiveUserId());
        const deletedList = await getDeletedUris(uid);
        const validInitial = initialPhotos
          .filter(Boolean)
          .filter((u) => !isDeletedUri(u, deletedList)) as string[];
        if (validInitial.length > 0) {
          hasHydratedFromInitial.current = true;
          const resolvedSlots: (string | null)[] = [...validInitial];
          while (resolvedSlots.length < TOTAL_SLOTS) {
            resolvedSlots.push(null);
          }
          setImages(resolvedSlots);
          if (resolvedSlots[0]) {
            setProfileImage(resolvedSlots[0]);
            setProfileImageUrl(resolvedSlots[0]);
          }
          if (uid) {
            AsyncStorage.setItem(`user_photos_${uid}`, JSON.stringify(resolvedSlots)).catch(() => {});
          }
          AsyncStorage.setItem('onboardingImages', JSON.stringify(resolvedSlots)).catch(() => {});
        }
      })();
    }
  }, [initialPhotos, isDeletedUri, getDeletedUris, localUserId, resolveActiveUserId, setImages, setProfileImage, setProfileImageUrl, propUserId]);

  useEffect(() => {
    const init = async () => {
      const uid = await resolveActiveUserId();
      if (uid) {
        setLocalUserId(uid);
        setAuthUserId?.(uid);
      }

      if (isInitRef.current && activeUserKeyRef.current === uid) return;
      isInitRef.current = true;
      if (uid) activeUserKeyRef.current = uid;

      const currentValid = (images || []).filter(Boolean);
      if (currentValid.length === 0) {
        try {
          const userKey = uid ? `user_photos_${uid}` : 'onboardingImages';
          const stored = await AsyncStorage.getItem(userKey);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.some(Boolean) && !hasUserEdited.current) {
              const deletedList = await getDeletedUris(uid);
              const slots = parsed.filter((u) => u && !isDeletedUri(u, deletedList));
              while (slots.length < TOTAL_SLOTS) slots.push(null);
              if (slots.some(Boolean)) {
                setImages(slots);
                if (slots[0]) {
                  setProfileImage(slots[0]);
                  setProfileImageUrl(slots[0]);
                }
              }
            }
          }
        } catch {}
      }

      if (uid) {
        getAllImagesRef.current(uid, {
          onSuccess: async (data: any) => {
            const mapped = mapImagesToSlots(data, TOTAL_SLOTS);
            // Always keep imageMap and serverImages up to date so deletion matching has IDs
            setImageMap(mapped.imageIdByIndex);
            setServerImages(mapped.normalized);

            if (hasUserEdited.current) return;
            const deletedList = await getDeletedUris(uid);
            const activeSlots = mapped.slots.filter((u) => u && !isDeletedUri(u, deletedList));
            while (activeSlots.length < TOTAL_SLOTS) {
              activeSlots.push(null);
            }
            if (activeSlots.some(Boolean)) {
              setImages(activeSlots);
              if (activeSlots[0]) {
                setProfileImage(activeSlots[0]);
                setProfileImageUrl(activeSlots[0]);
              }
              AsyncStorage.setItem(`user_photos_${uid}`, JSON.stringify(activeSlots)).catch(() => {});
            }
          },
          onError: () => {},
        });
      }
    };
    void init();
  }, [resolveActiveUserId, propUserId]);

  const handlePickImage = (index: number) => {
    setSelectedSlotIndex(index);
    setShowAddPhotoModal(true);
  };

  const handleSelectSource = async (source: 'gallery' | 'camera') => {
    setShowAddPhotoModal(false);
    const index = selectedSlotIndex ?? 0;
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        alert(t('profile.profilephotogrid.permission_required'), t('profile.profilephotogrid.please_allow_camera_or_photo_library_access_to_c'));
        return;
      }

      const options = { mediaType: 'photo' as const, quality: 0.8 as const };
      const result =
        source === 'camera'
          ? await launchCamera(options)
          : await launchImageLibrary(options);

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.uri) {
          hasUserEdited.current = true;
          setUploadingSlot(index);
          const oldImageId = imageMap[index];
          const current = [...(images || [])];
          while (current.length <= index) current.push(null);
          current[index] = asset.uri;
          while (current.length < TOTAL_SLOTS) current.push(null);
          setImages(current);

          if (index === 0) {
            setProfileImage(asset.uri);
            setProfileImageUrl(asset.uri);
            AsyncStorage.setItem('profileImage', asset.uri).catch(() => {});
          }
          AsyncStorage.setItem('onboardingImages', JSON.stringify(current)).catch(() => {});
          if (localUserId) {
            AsyncStorage.setItem(`user_photos_${localUserId}`, JSON.stringify(current)).catch(() => {});
          }

          // Clear any tombstones matching this new photo
          if (localUserId) {
            const keysToClean = [`deleted_photos_${localUserId}`, 'deleted_image_uris'];
            const assetFilename = getFilenameFromUrl(asset.uri);
            for (const key of keysToClean) {
              try {
                const raw = await AsyncStorage.getItem(key);
                const list: string[] = raw ? JSON.parse(raw) : [];
                const filtered = list.filter((item) => {
                  if (item === asset.uri || item === getAbsoluteUrl(asset.uri)) return false;
                  if (assetFilename && item === assetFilename) return false;
                  return true;
                });
                await AsyncStorage.setItem(key, JSON.stringify(filtered));
              } catch {}
            }
          }

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
              onSuccess: async (uploadRes: any) => {
                if (oldImageId) {
                  await deleteImage.mutateAsync({ imageId: oldImageId, userId: localUserId || undefined }).catch(() => {});
                }

                const newId = uploadRes?.id || uploadRes?.data?.id || (uploadRes?.imageId ? Number(uploadRes.imageId) : undefined);
                const newUrl = uploadRes?.imageUrl || uploadRes?.data?.imageUrl || (typeof uploadRes === 'string' ? uploadRes : undefined);

                if (newId) {
                  setImageMap((prev) => ({ ...prev, [index]: Number(newId) }));
                }

                if (localUserId) {
                  try {
                    const data = await getAllImages.mutateAsync(localUserId);
                    const mapped = mapImagesToSlots(data, TOTAL_SLOTS);
                    setServerImages(mapped.normalized);

                    // Map true server image ID to this slot so future deletes target the exact ID
                    const found = mapped.normalized.find((img) => {
                      if (!img.imageUrl) return false;
                      if (newUrl && (img.imageUrl === newUrl || getAbsoluteUrl(img.imageUrl) === getAbsoluteUrl(newUrl))) return true;
                      const f1 = getFilenameFromUrl(img.imageUrl);
                      const f2 = getFilenameFromUrl(asset.uri);
                      if (f1 && f2 && f1 === f2) return true;
                      return false;
                    });
                    if (found?.id) {
                      setImageMap((prev) => ({ ...prev, [index]: Number(found.id) }));
                    }
                  } catch (e) {
                    console.warn('[ProfilePhotoGrid] Could not refresh server image IDs after upload:', e);
                  }

                  const validCurrent = current.filter(Boolean) as string[];
                  apiClient.put('/profile/update', {
                    userId: localUserId,
                    photos: validCurrent,
                    images: validCurrent,
                    profileImageUrl: validCurrent[0] || '',
                    photo: validCurrent[0] || '',
                  }).catch(() => {});
                }

                AsyncStorage.setItem('onboardingImages', JSON.stringify(current)).catch(() => {});
                if (localUserId) {
                  AsyncStorage.setItem(`user_photos_${localUserId}`, JSON.stringify(current)).catch(() => {});
                }
              },
              onError: (err) => {
                console.error('Image upload failed:', err);
                alert(t('profile.profilephotogrid.upload_failed'), t('profile.profilephotogrid.failed_to_upload_image_please_try_again'));
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

  const performDeleteImage = async (index: number) => {
    const currentList = [...(images || [])];
    hasUserEdited.current = true;
    const targetUri = currentList[index];
    if (!targetUri) return;

    // 1. Instant optimistic update: remove immediately so UI changes with 0ms lag
    const remainingPhotos = currentList.filter((item, i) => i !== index && Boolean(item)) as string[];
    const nextSlots: (string | null)[] = [...remainingPhotos];
    while (nextSlots.length < TOTAL_SLOTS) {
      nextSlots.push(null);
    }
    setImages(nextSlots);

    // 2. Update primary profile photo in context
    const newPrimary = nextSlots[0] || null;
    setProfileImage(newPrimary);
    setProfileImageUrl(newPrimary);

    // 3. Update imageMap slot indices immediately
    const deletedImageId = imageMap[index];
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

    const uid = localUserId || (await resolveActiveUserId());
    if (uid && !localUserId) setLocalUserId(uid);

    // 4. Record as deleted in AsyncStorage so background queries NEVER resurrect it
    if (targetUri) void recordDeletedUri(targetUri, uid);

    // 5. Persist to AsyncStorage immediately (both global and user-scoped)
    AsyncStorage.setItem('onboardingImages', JSON.stringify(nextSlots)).catch(() => {});
    if (uid) {
      AsyncStorage.setItem(`user_photos_${uid}`, JSON.stringify(nextSlots)).catch(() => {});
    }
    if (newPrimary) {
      AsyncStorage.setItem('profileImage', newPrimary).catch(() => {});
    } else {
      AsyncStorage.removeItem('profileImage').catch(() => {});
    }

    // Ensure remaining active photos are NEVER in deleted tombstones
    const allRemaining = nextSlots.filter(Boolean) as string[];
    const activeSet = new Set([
      ...allRemaining,
      ...allRemaining.map((item) => getAbsoluteUrl(item) || ''),
    ].filter(Boolean));

    const keysToClean = uid ? [`deleted_photos_${uid}`, 'deleted_image_uris'] : ['deleted_image_uris'];
    for (const key of keysToClean) {
      try {
        const raw = await AsyncStorage.getItem(key);
        const list: string[] = raw ? JSON.parse(raw) : [];
        const filtered = list.filter((item) => !activeSet.has(item) && !activeSet.has(getAbsoluteUrl(item) || ''));
        await AsyncStorage.setItem(key, JSON.stringify(filtered));
      } catch {}
    }

    // 6. In background: resolve server imageId and delete on server
    let currentServerImages = serverImages;
    let imageId: number | undefined = deletedImageId;

    if (!imageId) {
      const targetFilename = getFilenameFromUrl(targetUri);
      const isGenericFilename = ['photo.jpg', 'image.jpg', 'default.jpg'].includes(targetFilename.toLowerCase());
      const matched = currentServerImages.find((img) => {
        if (img.id === null || img.id === undefined) return false;
        if (!img.imageUrl || !targetUri) return false;
        if (img.imageUrl === targetUri) return true;
        if (getAbsoluteUrl(img.imageUrl) === getAbsoluteUrl(targetUri)) return true;
        const imgFilename = getFilenameFromUrl(img.imageUrl);
        if (targetFilename && imgFilename && !isGenericFilename && targetFilename === imgFilename) return true;
        return false;
      });
      imageId = matched?.id ?? (currentServerImages[index]?.id ? Number(currentServerImages[index].id) : undefined);
      if (matched?.imageUrl && matched.imageUrl !== targetUri) void recordDeletedUri(matched.imageUrl, uid);
    }

    if (!imageId && uid) {
      try {
        const fetched = await getAllImages.mutateAsync(uid);
        const mapped = mapImagesToSlots(fetched, TOTAL_SLOTS);
        currentServerImages = mapped.normalized;
        setServerImages(mapped.normalized);
        const matched = mapped.normalized.find((img) => {
          if (!img.imageUrl || !targetUri) return false;
          if (img.imageUrl === targetUri || getAbsoluteUrl(img.imageUrl) === getAbsoluteUrl(targetUri)) return true;
          return false;
        });
        if (matched?.id) imageId = matched.id;
      } catch (e) {
        console.warn('[ProfilePhotoGrid] Could not refresh server images before delete:', e);
      }
    }

    // Update serverImages list
    if (imageId) {
      setServerImages((prev) => prev.filter((img) => img.id !== imageId));
    }

    // Sync remaining photos to profile endpoint
    if (uid) {
      apiClient.put('/profile/update', {
        userId: uid,
        photos: remainingPhotos,
        images: remainingPhotos,
        profileImageUrl: newPrimary || '',
        photo: newPrimary || '',
      }).catch(() => {});
    }

    // 7. Delete on server (pass imageId or targetUri, plus userId & imageUrl)
    // Note: Do NOT emit AMARA_PROFILE_UPDATED here; deleteImage.mutate onSuccess will emit once server delete succeeds
    const effectiveDeleteId = imageId ?? targetUri;
    if (effectiveDeleteId) {
      deleteImage.mutate(
        {
          imageId: effectiveDeleteId,
          userId: uid || undefined,
          imageUrl: targetUri || undefined,
        } as any,
        {
          onSuccess: () => {
            // If the deleted photo was slot 0 (primary) and we have remaining photos, promote slot 0 on backend
            if (index === 0 && uid && nextSlots[0]) {
              const nextPrimaryId = currentServerImages.find(
                (img) =>
                  img.id !== imageId &&
                  img.imageUrl &&
                  nextSlots[0] &&
                  (img.imageUrl === nextSlots[0] ||
                    getAbsoluteUrl(img.imageUrl) === getAbsoluteUrl(nextSlots[0]) ||
                    (getFilenameFromUrl(img.imageUrl) && getFilenameFromUrl(img.imageUrl) === getFilenameFromUrl(nextSlots[0])))
              )?.id;
              if (nextPrimaryId) {
                setProfilePhoto.mutate({ uid, imageId: nextPrimaryId });
              }
            }
          },
          onError: (err: any) => {
            console.warn('[ProfilePhotoGrid] Delete image server error:', err);
            const serverMessage =
              err?.response?.data?.message ||
              err?.response?.data?.error ||
              t('profile.uploadimage.failed_to_delete_image_from_server', {
                defaultValue: 'Could not delete photo from server.',
              });
            alert(t('common.error', { defaultValue: 'Error' }), serverMessage);
            // Restore images if server rejected the deletion
            if (uid) {
              getAllImagesRef.current(uid, {
                onSuccess: (data: any) => {
                  const mapped = mapImagesToSlots(data, TOTAL_SLOTS);
                  setImageMap(mapped.imageIdByIndex);
                  setServerImages(mapped.normalized);
                  setImages(mapped.slots);
                },
              });
            }
          },
        }
      );
    }
  };

  const handleDeleteImage = (index: number) => {
    const currentList = [...(images || [])];
    const targetUri = currentList[index];
    if (!targetUri) return;

    const nonNullCount = currentList.filter(Boolean).length;
    if (nonNullCount <= 3) {
      setShowFacePhotoModal(true);
      return;
    }

    // Direct deletion without confirmation popup when more than 3 photos exist
    void performDeleteImage(index);
  };

    // Note: Dedicated image endpoints (/users/images/{id}) manage photos.
    // The backend rejects 'photos' in /profile/update with HTTP 400.

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
                key={uri}
                style={[
                  styles.slot,
                  {
                    width: itemWidth,
                    height: itemHeight,
                    backgroundColor: themeColors.surfaceLight,
                  },
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => handlePickImage(index)}
                  style={{ width: '100%', height: '100%' }}
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
                </TouchableOpacity>
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
              key={`empty-${index}`}
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

      {/* Screenshot 2 Modal: Add Photo Bottom Sheet */}
      <Modal
        visible={showAddPhotoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddPhotoModal(false)}
      >
        <TouchableOpacity
          style={styles.bottomSheetBackdrop}
          activeOpacity={1}
          onPress={() => setShowAddPhotoModal(false)}
        >
          <View
            style={[
              styles.bottomSheetCard,
              { backgroundColor: isDark ? '#1F1B2E' : '#FFFFFF' },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <Text
              style={[
                styles.bottomSheetTitle,
                { color: isDark ? '#FFFFFF' : '#111827' },
              ]}
            >{t('profile.profilephotogrid.add_photo')}</Text>

            <TouchableOpacity
              style={styles.bottomSheetOption}
              onPress={() => handleSelectSource('gallery')}
              activeOpacity={0.7}
            >
              <Feather
                name="upload"
                size={22}
                color={isDark ? '#FFFFFF' : '#111827'}
                style={styles.optionIcon}
              />
              <Text
                style={[
                  styles.bottomSheetOptionText,
                  { color: isDark ? '#FFFFFF' : '#111827' },
                ]}
              >{t('profile.profilephotogrid.upload_from_gallery')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bottomSheetOption}
              onPress={() => handleSelectSource('camera')}
              activeOpacity={0.7}
            >
              <Feather
                name="camera"
                size={22}
                color={isDark ? '#FFFFFF' : '#111827'}
                style={styles.optionIcon}
              />
              <Text
                style={[
                  styles.bottomSheetOptionText,
                  { color: isDark ? '#FFFFFF' : '#111827' },
                ]}
              >{t('profile.profilephotogrid.use_camera')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Screenshot 3 Modal: Face photo required Alert Pop-up */}
      <Modal
        visible={showFacePhotoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFacePhotoModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.faceModalCard,
              { backgroundColor: isDark ? '#1F1B2E' : '#FFFFFF' },
            ]}
          >
            <View style={styles.faceModalHeader}>
              <Text
                style={[
                  styles.faceModalTitle,
                  { color: isDark ? '#FFFFFF' : '#111827' },
                ]}
              >{t('profile.profilephotogrid.more_photos_required', { defaultValue: 'More photos required' })}</Text>
              <TouchableOpacity
                onPress={() => setShowFacePhotoModal(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Icon
                  name="close"
                  size={20}
                  color={isDark ? '#9CA3AF' : '#374151'}
                />
              </TouchableOpacity>
            </View>

            <Text
              style={[
                styles.faceModalBody,
                { color: isDark ? '#D1D5DB' : '#374151' },
              ]}
            >{t('profile.profilephotogrid.min_three_photos_required', {
                defaultValue:
                  'Your profile needs at least 3 photos. To delete this photo, please first upload another one. Afterward, you can delete this photo.',
              })}</Text>

            <TouchableOpacity
              style={styles.faceModalOkayBtn}
              onPress={() => setShowFacePhotoModal(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.faceModalOkayBtnText}>{t('profile.profilephotogrid.okay', { defaultValue: 'Okay' })}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Photo Removal / Face Photo Confirmation Dialog */}
      {AlertComponent}
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
  // Screenshot 2: Add Photo Bottom Sheet Styles
  bottomSheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheetCard: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 22,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingHorizontal: 22,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  bottomSheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  optionIcon: {
    marginRight: 14,
  },
  bottomSheetOptionText: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Screenshot 3: Face photo required Alert Pop-up Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  faceModalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 22,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  faceModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faceModalTitle: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  faceModalBody: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 18,
    marginBottom: 24,
    fontWeight: '400',
  },
  faceModalOkayBtn: {
    backgroundColor: '#E05353',
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 28,
    alignSelf: 'flex-end',
    elevation: 2,
    shadowColor: '#E05353',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  faceModalOkayBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
