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
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAbsoluteUrl, isApiHostedUrl } from '../../../api/apiClient';
import { mapImagesToSlots, useUserImages } from '../../../api/useImages';
import { useProfile } from '../../../api/useProfile';
import AppContext from '../../../context/CreateGlobalStateContext';
import { Colors, useTheme } from '../../../theme';
import { getAuthSession, isResolvedApiUserId } from '../../../utils/session';
import { getAuthToken } from '../../../utils/sessionHelper';
import { useAlert } from '../../AlertModal';
import { requestPermissions } from '../../../utils/types/permission';
import { t, useTranslation } from '../../../i18n';

const TOTAL_SLOTS = 6;

interface ProfilePhotoGridProps {
  initialPhotos?: (string | null)[];
}

const ProfilePhotoGrid: React.FC<ProfilePhotoGridProps> = ({ initialPhotos }) => {
  useTranslation();
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
  const [showAddPhotoModal, setShowAddPhotoModal] = useState(false);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [showFacePhotoModal, setShowFacePhotoModal] = useState(false);

  const hasUserEdited = useRef(false);
  const isInitRef = useRef(false);
  const hasHydratedFromInitial = useRef(false);
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

  // Hydrate once when initialPhotos arrives if context is empty and user hasn't edited
  useEffect(() => {
    if (hasHydratedFromInitial.current || hasUserEdited.current) return;
    const currentValid = (images || []).filter(Boolean);
    if (currentValid.length === 0 && initialPhotos && initialPhotos.some(Boolean)) {
      hasHydratedFromInitial.current = true;
      const validInitial = initialPhotos.filter(Boolean) as string[];
      const resolvedSlots: (string | null)[] = [...validInitial];
      while (resolvedSlots.length < TOTAL_SLOTS) {
        resolvedSlots.push(null);
      }
      setImages(resolvedSlots);
      if (resolvedSlots[0]) {
        setProfileImage(resolvedSlots[0]);
        setProfileImageUrl(resolvedSlots[0]);
      }
      AsyncStorage.setItem('onboardingImages', JSON.stringify(resolvedSlots)).catch(() => {});
    }
  }, [initialPhotos]);

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

  useEffect(() => {
    if (isInitRef.current) return;
    isInitRef.current = true;

    const init = async () => {
      const currentValid = (images || []).filter(Boolean);
      if (currentValid.length === 0) {
        try {
          const stored = await AsyncStorage.getItem('onboardingImages');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.some(Boolean) && !hasUserEdited.current) {
              const slots = [...parsed];
              while (slots.length < TOTAL_SLOTS) slots.push(null);
              setImages(slots);
              if (slots[0]) {
                setProfileImage(slots[0]);
                setProfileImageUrl(slots[0]);
              }
              return;
            }
          }
        } catch {}
      }

      const uid = await resolveActiveUserId();
      if (uid) {
        setLocalUserId(uid);
        setAuthUserId?.(uid);
        getAllImagesRef.current(uid, {
          onSuccess: (data: any) => {
            if (hasUserEdited.current) return;
            const mapped = mapImagesToSlots(data, TOTAL_SLOTS);
            if (mapped.slots.some(Boolean)) {
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
            }
          },
          onError: () => {},
        });
      }
    };
    void init();
  }, []);

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
        alert('Permission Required', 'Please allow camera or photo library access to continue.');
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

  const handleDeleteImage = (index: number) => {
    const currentList = [...(images || [])];
    const nonNullCount = currentList.filter(Boolean).length;

    // Requirement 3: When clicking delete icon on first photo OR when only 1 photo exists
    if (index === 0 || nonNullCount <= 1) {
      setShowFacePhotoModal(true);
      return;
    }

    hasUserEdited.current = true;
    const imageId = imageMap[index];

    // 1. Instant optimistic update: filter out deleted image and shift remaining forward
    const remainingPhotos = currentList.filter((item, i) => i !== index && Boolean(item)) as string[];
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
    AsyncStorage.setItem('onboardingImages', JSON.stringify(nextSlots)).catch(() => {});
    if (newPrimary) {
      AsyncStorage.setItem('profileImage', newPrimary).catch(() => {});
    } else {
      AsyncStorage.removeItem('profileImage').catch(() => {});
    }

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
        onError: (err) => {
          console.warn('Delete image server error:', err);
        },
      });
    }

    // 6. Synchronize profile photos array on backend
    updateProfile.mutate(
      {
        userId: localUserId || undefined,
        photos: remainingPhotos,
      },
      {
        onError: (err) => console.warn('Update profile photos sync error:', err),
      }
    );
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
              >{t('profile.profilephotogrid.face_photo_required')}</Text>
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
            >{t('profile.profilephotogrid.every_user_needs_to_have_at_least_one_face_picture_in_their_profile_to')}</Text>

            <TouchableOpacity
              style={styles.faceModalOkayBtn}
              onPress={() => setShowFacePhotoModal(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.faceModalOkayBtnText}>{t('profile.profilephotogrid.okay')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
