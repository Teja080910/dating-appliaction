import React, { useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
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
import { useQueryClient } from '@tanstack/react-query';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAbsoluteUrl, isApiHostedUrl } from '../../../api/apiClient';
import {
  mapImagesToSlots,
  useUserImages,
  NormalizedUserImage,
  MAX_PROFILE_IMAGES,
  UPLOAD_PHOTO_OPTIONS,
  parseUploadResponse,
  getUploadErrorMessage,
  getPhotoRejectionKind,
  getPhotoRejectionCopy,
} from '../../../api/useImages';
import AppContext from '../../../context/CreateGlobalStateContext';
import { Colors, useTheme } from '../../../theme';
import { verifySingleProfilePhoto } from '../../../api/useFaceValidation';
import { getAuthSession, isResolvedApiUserId, isSameUserId } from '../../../utils/session';
import { getAuthToken, getUserId } from '../../../utils/sessionHelper';
import { useAlert } from '../../AlertModal';
import { requestPermissions } from '../../../utils/types/permission';
import { t, useTranslation } from '../../../i18n';

const TOTAL_SLOTS = MAX_PROFILE_IMAGES;

const GridPhoto = React.memo(
  ({
    uri,
    authToken,
    style,
  }: {
    uri: string;
    authToken: string | null;
    style: any;
  }) => {
    const source = useMemo(
      () =>
        uri && (uri.startsWith('http://') || uri.startsWith('https://'))
          ? {
              uri,
              headers: {
                'ngrok-skip-browser-warning': '69420',
                'User-Agent': 'AMARA-App',
                ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
              },
            }
          : { uri },
      [uri, authToken],
    );

    return <Image source={source} style={style} resizeMode="cover" />;
  },
);

interface ProfilePhotoGridProps {
  initialPhotos?: (string | null)[];
  userId?: string;
  /** Server-side verification flag, so older verified accounts are protected too. */
  verifiedSelfie?: boolean;
}

const ProfilePhotoGrid: React.FC<ProfilePhotoGridProps> = ({
  initialPhotos,
  userId: propUserId,
  verifiedSelfie: propVerifiedSelfie,
}) => {
  useTranslation();
  const queryClient = useQueryClient();
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
    verifiedSelfie,
  } = useContext(AppContext);

  const { uploadImage, getAllImages, deleteImage, setProfilePhoto } = useUserImages();
  const [imageMap, setImageMap] = useState<Record<number, number>>({});
  const [serverImages, setServerImages] = useState<NormalizedUserImage[]>([]);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [localUserId, setLocalUserId] = useState<string | null>(null);
  const [showAddPhotoModal, setShowAddPhotoModal] = useState(false);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [showFacePhotoModal, setShowFacePhotoModal] = useState(false);
  const [verifiedSelfiePhoto, setVerifiedSelfiePhoto] = useState<string | null>(null);
  const [selfieVerifiedFlag, setSelfieVerifiedFlag] = useState(false);

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

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      AsyncStorage.getItem('@amara_verified_selfie_photo').catch(() => null),
      AsyncStorage.getItem('@selfie_verified').catch(() => null),
    ]).then(([photo, flag]) => {
      if (!isMounted) return;
      if (photo) setVerifiedSelfiePhoto(String(photo));
      setSelfieVerifiedFlag(flag === 'true');
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const isVerifiedSelfiePhoto = (uri?: string | null, index?: number) => {
    const clean = String(uri || '').trim();
    if (!clean) return false;

    if (verifiedSelfiePhoto) {
      const stored = String(verifiedSelfiePhoto).trim();
      const storedAbs = getAbsoluteUrl(stored) || stored;
      const cleanAbs = getAbsoluteUrl(clean) || clean;
      if (stored === clean || storedAbs === cleanAbs) return true;

      const genericFilenames = ['photo.jpg', 'image.jpg', 'default.jpg'];
      const storedFile = getFilenameFromUrl(stored).toLowerCase();
      const cleanFile = getFilenameFromUrl(clean).toLowerCase();
      if (
        storedFile &&
        cleanFile &&
        storedFile === cleanFile &&
        !genericFilenames.includes(storedFile) &&
        !genericFilenames.includes(cleanFile)
      ) {
        return true;
      }
      return false;
    }

    // Older verified accounts predate the stored marker. Their selfie is the
    // first gallery photo created during verification.
    return (
      index === 0 &&
      (Boolean(propVerifiedSelfie) || Boolean(verifiedSelfie) || selfieVerifiedFlag)
    );
  };

  const resolveActiveUserId = useCallback(async () => {
    const directUid = await AsyncStorage.getItem('userId').catch(() => null);
    const authSession = await getAuthSession().catch(() => null);
    const storedUid = await getUserId().catch(() => null);

    const candidates = [propUserId, authUserId, storedUid, directUid, authSession?.userId];

    // Writes are ownership-checked against the logged-in account, so the
    // alphanumeric code (SA1000) must win over a numeric DB id.
    const slug = candidates.find(
      (value) => value && /[A-Za-z]/.test(String(value)) && isResolvedApiUserId(value),
    );
    if (slug) return String(slug);

    const fallback = candidates.find((value) => value && isResolvedApiUserId(value));
    return fallback ? String(fallback) : null;
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
    const filename = getFilenameFromUrl(clean).toLowerCase();
    const isGeneric =
      ['photo.jpg', 'image.jpg', 'default.jpg'].includes(filename) ||
      filename.startsWith('gallery_') ||
      filename.startsWith('photo_') ||
      filename.startsWith('image_') ||
      filename.startsWith('rn_image_picker');

    const isRemoteUrl = /^https?:\/\//i.test(clean);

    return deletedList.some((d) => {
      if (!d) return false;
      const cleanD = String(d).trim();
      if (!cleanD) return false;
      if (cleanD === clean || cleanD === abs) return true;
      const dAbs = getAbsoluteUrl(cleanD) || cleanD;
      if (dAbs === abs || dAbs === clean) return true;
      const dFile = getFilenameFromUrl(cleanD).toLowerCase();
      // Only match by filename for device-local URIs. Remote photos are
      // identified by full URL because the backend reuses names such as
      // /amara/SA1000/3.jpg, which would otherwise hide a new upload.
      if (filename && dFile && !isGeneric && filename === dFile) return !isRemoteUrl;
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

  const getStoredUserPhotos = useCallback(async (uid?: string | null) => {
    if (!uid) return null;
    const clean = String(uid).trim();
    const digits = clean.replace(/\D/g, '');
    const keys = [
      `user_photos_${clean}`,
      digits ? `user_photos_${digits}` : null,
      digits ? `user_photos_usr_woman_${digits}` : null,
      digits ? `user_photos_usr_man_${digits}` : null,
      'onboardingImages',
    ].filter(Boolean) as string[];

    for (const k of keys) {
      try {
        const raw = await AsyncStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.some(Boolean)) {
            return parsed;
          }
        }
      } catch {}
    }
    return null;
  }, []);

  const saveStoredUserPhotos = useCallback(async (uid: string | null | undefined, slots: (string | null)[]) => {
    await AsyncStorage.setItem('onboardingImages', JSON.stringify(slots)).catch(() => {});
    if (!uid) return;
    const clean = String(uid).trim();
    const digits = clean.replace(/\D/g, '');
    await AsyncStorage.setItem(`user_photos_${clean}`, JSON.stringify(slots)).catch(() => {});
    if (digits && digits !== clean) {
      await AsyncStorage.setItem(`user_photos_${digits}`, JSON.stringify(slots)).catch(() => {});
    }
  }, []);

  // Reset hydration and edits when switching users
  useEffect(() => {
    const currentUid = propUserId ? String(propUserId).trim() : null;
    const prevUid = activeUserKeyRef.current ? String(activeUserKeyRef.current).trim() : null;
    if (currentUid && prevUid && !isSameUserId(prevUid, currentUid) && uploadingSlot === null) {
      hasHydratedFromInitial.current = false;
      hasUserEdited.current = false;
      isInitRef.current = false;
    }
    if (currentUid) {
      activeUserKeyRef.current = currentUid;
    }
  }, [propUserId, uploadingSlot]);

  // Hydrate from initialPhotos (profileQuery / server data) if user hasn't edited
  useEffect(() => {
    if (hasHydratedFromInitial.current || hasUserEdited.current || uploadingSlot !== null) return;
    if (initialPhotos && initialPhotos.some(Boolean)) {
      void (async () => {
        const uid = localUserId || (await resolveActiveUserId());
        const deletedList = await getDeletedUris(uid);
        const validInitial = initialPhotos
          .filter(Boolean)
          .filter((u) => !isDeletedUri(u, deletedList)) as string[];

        // Check locally stored user_photos across scoped keys
        const storedRaw = await getStoredUserPhotos(uid);
        let storedSlots: (string | null)[] = [];
        if (Array.isArray(storedRaw)) {
          storedSlots = storedRaw.filter((u) => u && !isDeletedUri(u, deletedList));
        }

        // Prefer whichever source has more valid photos
        const base = storedSlots.length >= validInitial.length ? storedSlots : validInitial;
        const resolvedSlots: (string | null)[] = [...base];
        while (resolvedSlots.length < TOTAL_SLOTS) {
          resolvedSlots.push(null);
        }

        if (resolvedSlots.some(Boolean)) {
          hasHydratedFromInitial.current = true;
          setImages(resolvedSlots);
          if (resolvedSlots[0]) {
            setProfileImage(resolvedSlots[0]);
            setProfileImageUrl(resolvedSlots[0]);
          }
          if (base.length >= storedSlots.length) {
            await saveStoredUserPhotos(uid, resolvedSlots);
          }
        }
      })();
    }
  }, [initialPhotos, isDeletedUri, getDeletedUris, localUserId, resolveActiveUserId, setImages, setProfileImage, setProfileImageUrl, propUserId, uploadingSlot, getStoredUserPhotos, saveStoredUserPhotos]);

  useEffect(() => {
    const init = async () => {
      const uid = await resolveActiveUserId();
      if (uid) {
        setLocalUserId(uid);
        setAuthUserId?.(uid);
      }

      if (isInitRef.current && isSameUserId(activeUserKeyRef.current, uid)) return;
      isInitRef.current = true;
      if (uid) activeUserKeyRef.current = uid;

      const currentValid = (images || []).filter(Boolean);
      try {
        const stored = await getStoredUserPhotos(uid);
        if (Array.isArray(stored) && stored.some(Boolean) && !hasUserEdited.current && uploadingSlot === null) {
          const deletedList = await getDeletedUris(uid);
          const slots = stored.filter((u) => u && !isDeletedUri(u, deletedList));
          while (slots.length < TOTAL_SLOTS) slots.push(null);
          if (slots.some(Boolean)) {
            const validSlots = slots.filter(Boolean);
            if (validSlots.length >= currentValid.length) {
              setImages(slots);
              if (slots[0]) {
                setProfileImage(slots[0]);
                setProfileImageUrl(slots[0]);
              }
            }
          }
        }
      } catch {}

      if (uid) {
        getAllImagesRef.current(uid, {
          onSuccess: async (data: any) => {
            const mapped = mapImagesToSlots(data, TOTAL_SLOTS);
            // Always keep imageMap and serverImages up to date so deletion matching has IDs
            setImageMap(mapped.imageIdByIndex);
            setServerImages(mapped.normalized);

            if (hasUserEdited.current || uploadingSlot !== null) return;
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
              await saveStoredUserPhotos(uid, activeSlots);
            }
          },
          onError: () => {},
        });
      }
    };
    void init();
  }, [resolveActiveUserId, propUserId, uploadingSlot, getStoredUserPhotos, saveStoredUserPhotos]);

  const handlePickImage = (index: number) => {
    setSelectedSlotIndex(index);
    setShowAddPhotoModal(true);
  };

  const handleSelectSource = async (source: 'gallery' | 'camera') => {
    setShowAddPhotoModal(false);
    const index = selectedSlotIndex ?? 0;
    const activeUid = localUserId || (await resolveActiveUserId());
    if (activeUid && !localUserId) {
      setLocalUserId(activeUid);
    }
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        alert(t('profile.profilephotogrid.permission_required'), t('profile.profilephotogrid.please_allow_camera_or_photo_library_access_to_c'));
        return;
      }

      const result =
        source === 'camera'
          ? await launchCamera(UPLOAD_PHOTO_OPTIONS)
          : await launchImageLibrary(UPLOAD_PHOTO_OPTIONS);

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.uri) {
          hasUserEdited.current = true;
          setUploadingSlot(index);
          const previousPhoto = (images || [])[index] || null;
          const oldImageId = imageMap[index];
          // True only when the profile has no photos at all: this upload is the
          // first photo, which only needs to show a real human face. Later
          // photos must also match the verified selfie.
          const hasNoExistingPhoto = !(images || []).some(Boolean);
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
          if (activeUid) {
            AsyncStorage.setItem(`user_photos_${activeUid}`, JSON.stringify(current)).catch(() => {});
          }

          // Clear any tombstones matching this new photo
          if (activeUid) {
            const keysToClean = [`deleted_photos_${activeUid}`, 'deleted_image_uris'];
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

          // Face-check the photo before it is accepted. Runs for every account,
          // regardless of gender: the first photo must show a real human face,
          // every later one must match the verified selfie.
          const verdict = await verifySingleProfilePhoto({
            userId: activeUid || undefined,
            photoUri: asset.uri,
            isFirstPhoto: hasNoExistingPhoto,
          }).catch(() => null);

          if (verdict) {
            const reverted = [...(images || [])];
            while (reverted.length < TOTAL_SLOTS) reverted.push(null);
            reverted[index] = previousPhoto;
            setImages(reverted);
            if (index === 0) {
              setProfileImage(previousPhoto);
              setProfileImageUrl(previousPhoto);
            }
            setUploadingSlot(null);
            const copy = getPhotoRejectionCopy(verdict, t);
            alert(copy.title, copy.message, undefined, { force: true });
            return;
          }

          // At the 6-photo backend limit the old photo must be deleted before the
          // replacement is uploaded, otherwise the upload is rejected.
          if (oldImageId && activeUid && serverImages.length >= MAX_PROFILE_IMAGES) {
            try {
              await deleteImage.mutateAsync({ imageId: oldImageId, userId: activeUid }).catch(() => {});
            } catch {}
          }

          uploadImage.mutate(
            {
              uid: activeUid || undefined,
              photo: {
                uri: asset.uri,
                fileName: asset.fileName || `photo_${Date.now()}.jpg`,
                type: asset.type || 'image/jpeg',
                fileSize: asset.fileSize,
              },
            },
            {
              onSuccess: async (uploadRes: any) => {
                if (oldImageId && activeUid) {
                  await deleteImage.mutateAsync({ imageId: oldImageId, userId: activeUid }).catch(() => {});
                }

                const uploaded = parseUploadResponse(uploadRes);
                const newId = uploaded.id;
                let newUrl: string | null = uploaded.imageUrl;

                let finalUrl: string = newUrl || asset.uri || '';

                if (newId) {
                  setImageMap((prev) => ({ ...prev, [index]: Number(newId) }));
                }

                // Update images state with resolved server URL preserving all active slots
                const updated = [...current];
                updated[index] = finalUrl;
                while (updated.length < TOTAL_SLOTS) updated.push(null);
                setImages(updated);

                if (index === 0) {
                  setProfileImage(finalUrl);
                  setProfileImageUrl(finalUrl);
                  await AsyncStorage.setItem('profileImage', finalUrl).catch(() => {});
                  if (activeUid) {
                    await AsyncStorage.setItem(`user_profile_photo_${activeUid}`, finalUrl).catch(() => {});
                  }
                }

                // Await persisting updated list to storage so any readers see the latest state
                await saveStoredUserPhotos(activeUid, updated);

                // Scrub uploaded image URIs and filenames from deleted photo tombstones
                const scrubTargets = [asset.uri, newUrl, finalUrl].filter(Boolean) as string[];
                for (const targetUri of scrubTargets) {
                  const targetFilename = getFilenameFromUrl(targetUri);
                  if (activeUid) {
                    try {
                      const stored = await AsyncStorage.getItem(`deleted_photos_${activeUid}`);
                      if (stored) {
                        const parsed = JSON.parse(stored);
                        if (Array.isArray(parsed)) {
                          const filtered = parsed.filter((item: any) => {
                            const itemUri = typeof item === 'string' ? item : item?.uri || '';
                            const itemFn = getFilenameFromUrl(itemUri);
                            return itemUri !== targetUri && (!targetFilename || itemFn !== targetFilename);
                          });
                          await AsyncStorage.setItem(`deleted_photos_${activeUid}`, JSON.stringify(filtered));
                        }
                      }
                    } catch {}
                  }
                }

                if (activeUid) {
                  try {
                    const data = await getAllImages.mutateAsync(activeUid);
                    const mapped = mapImagesToSlots(data, TOTAL_SLOTS);
                    setServerImages(mapped.normalized);

                    // If newUrl was not returned directly from upload endpoint, resolve from latest image
                    if (!newUrl && mapped.normalized.length > 0) {
                      const found = mapped.normalized.find((img) => {
                        if (!img.imageUrl) return false;
                        const f1 = getFilenameFromUrl(img.imageUrl);
                        const f2 = getFilenameFromUrl(asset.uri);
                        if (f1 && f2 && f1 === f2) return true;
                        return false;
                      });
                      const resolvedImg = found || mapped.normalized[mapped.normalized.length - 1];
                      if (resolvedImg?.imageUrl) {
                        newUrl = resolvedImg.imageUrl;
                        finalUrl = getAbsoluteUrl(newUrl) || newUrl;
                        updated[index] = finalUrl;
                        setImages([...updated]);
                        if (index === 0) {
                          setProfileImage(finalUrl);
                          setProfileImageUrl(finalUrl);
                        }
                        await saveStoredUserPhotos(activeUid, updated);
                      }
                    }

                    // Map true server image ID to this slot so future deletes target the exact ID
                    const found = mapped.normalized.find((img) => {
                      if (!img.imageUrl) return false;
                      if (newUrl && (img.imageUrl === newUrl || getAbsoluteUrl(img.imageUrl) === getAbsoluteUrl(newUrl))) return true;
                      const f1 = getFilenameFromUrl(img.imageUrl);
                      const f2 = getFilenameFromUrl(asset.uri);
                      if (f1 && f2 && f1 === f2) return true;
                      return false;
                    });
                    const resolvedId = found?.id || newId;
                    if (resolvedId) {
                      setImageMap((prev) => ({ ...prev, [index]: Number(resolvedId) }));
                      if (index === 0) {
                        setProfilePhoto.mutate({ uid: activeUid, imageId: Number(resolvedId) });
                      }
                    }
                  } catch (e) {
                    console.warn('[ProfilePhotoGrid] Could not refresh server image IDs after upload:', e);
                    if (index === 0 && newId) {
                      setProfilePhoto.mutate({ uid: activeUid, imageId: Number(newId) });
                    }
                  }

                  queryClient.invalidateQueries({ queryKey: ['myProfile'] });
                  queryClient.invalidateQueries({ queryKey: ['profile-me'] });
                  queryClient.invalidateQueries({ queryKey: ['userImages'] });

                  DeviceEventEmitter.emit('AMARA_PROFILE_UPDATED', {
                    uid: activeUid,
                    photos: updated,
                    photo: updated[0] || '',
                  });
                }
              },
              onError: (err) => {
                const status = Number((err as any)?.response?.status);
                // Business rejections are shown in an alert; logging them with
                // console.error would open a LogBox error overlay in dev.
                const logUploadError = status >= 400 && status < 500 ? console.log : console.error;
                logUploadError('Image upload failed:', (err as any)?.response?.data || (err as any)?.message || err);
                const reverted = [...(images || [])];
                while (reverted.length < TOTAL_SLOTS) reverted.push(null);
                reverted[index] = previousPhoto;
                setImages(reverted);
                const rejectionKind = getPhotoRejectionKind(err, {
                  isPrimary: hasNoExistingPhoto,
                });
                if (rejectionKind) {
                  const copy = getPhotoRejectionCopy(rejectionKind, t);
                  alert(copy.title, copy.message, undefined, { force: true });
                } else {
                  alert(
                    t('profile.profilephotogrid.upload_failed'),
                    getUploadErrorMessage(err) ||
                      (err as any)?.message ||
                      t('profile.profilephotogrid.failed_to_upload_image_please_try_again'),
                    undefined,
                    { force: true },
                  );
                }
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

    if (isVerifiedSelfiePhoto(targetUri, index)) {
      alert(
        t('profile.profilephotogrid.cannot_delete_verified_title', {
          defaultValue: "Can't Delete Verified Photo",
        }),
        t('profile.profilephotogrid.cannot_delete_verified_desc', {
          defaultValue:
            "This is your verified selfie photo. It is used to confirm your profile is genuine, so it can't be deleted.",
        })
      );
      return;
    }

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
                key={`photo-slot-${index}`}
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
                  <GridPhoto uri={uri!} authToken={authToken} style={styles.image} />
                  {uploadingSlot === index && (
                    <View style={styles.uploadingOverlay}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    </View>
                  )}
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
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
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
