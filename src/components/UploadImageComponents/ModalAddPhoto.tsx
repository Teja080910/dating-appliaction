import { Modal, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import React, { useContext, useMemo, useState } from 'react';
import AppContext from '../../context/CreateGlobalStateContext';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, useTheme, type ThemeColors } from '../../theme';
import { requestPermissions } from '../../utils/types/permission';
import {
  MAX_PROFILE_IMAGES,
  UPLOAD_PHOTO_OPTIONS,
  useUserImages,
  parseUploadResponse,
  getUploadErrorMessage,
  getPhotoRejectionKind,
  getPhotoRejectionCopy,
} from '../../api/useImages';
import { verifySingleProfilePhoto } from '../../api/useFaceValidation';
import { getAuthSession, isResolvedApiUserId } from '../../utils/session';
import { getUserId } from '../../utils/sessionHelper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAlert } from '../AlertModal';
import { t, useTranslation } from '../../i18n';

const ModalAddPhoto = () => {
  useTranslation();
  const { alert, AlertComponent } = useAlert();
  const { themeColors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(themeColors, isDark), [themeColors, isDark]);
  const {
    isModalVisible,
    setIsModalVisible,
    selectedIndex,
    images,
    setImages,
    setProfileImage,
    setProfileImageUrl,
    authUserId,
    setAuthUserId,
  } = useContext(AppContext);

  const { uploadImage, setProfilePhoto } = useUserImages();
  const [isUploading, setIsUploading] = useState(false);
  const uploadedImageCount = Array.isArray(images)
    ? images.filter((image) => Boolean(image)).length
    : 0;

  const resolveActiveUserId = async () => {
    if (authUserId && isResolvedApiUserId(authUserId)) {
      return String(authUserId);
    }

    const backendUserId = await getUserId();
    if (backendUserId && isResolvedApiUserId(backendUserId)) {
      return String(backendUserId);
    }

    const authSession = await getAuthSession();
    if (authSession?.userId && isResolvedApiUserId(authSession.userId)) {
      return String(authSession.userId);
    }

    return null;
  };

  const onPickImage = async (type: 'camera' | 'gallery') => {
    const targetIndex =
      typeof selectedIndex === 'number' && selectedIndex >= 0 ? selectedIndex : 0;
    const isReplacingExisting = Boolean(images?.[targetIndex]);

    if (!isReplacingExisting && uploadedImageCount >= MAX_PROFILE_IMAGES) {
      alert(
        t('profile.modaladdphoto.photo_limit_reached'),
        t('profile.modaladdphoto.you_already_have_5_photos_saved_delete_one_photo')
      );
      setIsModalVisible(false);
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      alert(t('profile.profilephotogrid.permission_required'), t('profile.profilephotogrid.please_allow_camera_or_photo_library_access_to_c'));
      return;
    }

    const pickerResult =
      type === 'camera'
        ? await launchCamera(UPLOAD_PHOTO_OPTIONS)
        : await launchImageLibrary(UPLOAD_PHOTO_OPTIONS);

    const asset = pickerResult.assets?.[0];
    if (!asset?.uri) {
      if (pickerResult.errorMessage) {
        alert(t('profile.modaladdphoto.image_error'), pickerResult.errorMessage);
      }
      setIsModalVisible(false);
      return;
    }

    const userId = await resolveActiveUserId();
    if (userId) {
      setAuthUserId?.(String(userId));
    }

    // Prepare next slots by copying current images and updating only the chosen index
    const updateTargetSlot = (imageUrl: string) => {
      const nextSlots = Array.isArray(images) ? [...images] : Array(MAX_PROFILE_IMAGES).fill(null);
      while (nextSlots.length < MAX_PROFILE_IMAGES) {
        nextSlots.push(null);
      }
      nextSlots[targetIndex] = imageUrl;
      setImages(nextSlots);
      AsyncStorage.setItem('onboardingImages', JSON.stringify(nextSlots)).catch(() => {});
      if (userId) {
        AsyncStorage.setItem(`user_photos_${userId}`, JSON.stringify(nextSlots)).catch(() => {});
      }

      // Cache local file URI for Face Validation service sync
      AsyncStorage.getItem('@local_onboarding_photos')
        .then((raw) => {
          const list = raw ? JSON.parse(raw) : Array(MAX_PROFILE_IMAGES).fill(null);
          list[targetIndex] = asset.uri;
          return AsyncStorage.setItem('@local_onboarding_photos', JSON.stringify(list));
        })
        .catch(() => {});

      if (targetIndex === 0 || !images?.[0]) {
        setProfileImage(imageUrl);
        setProfileImageUrl(imageUrl);
        AsyncStorage.setItem('profileImage', imageUrl).catch(() => {});
      }
    };

    try {
      setIsUploading(true);
      // Face-check before upload, for every account regardless of gender.
      const verdict = await verifySingleProfilePhoto({
        userId: userId ? String(userId) : undefined,
        photoUri: asset.uri,
        isFirstPhoto: !uploadedImageCount,
      }).catch(() => null);

      if (verdict) {
        setIsModalVisible(false);
        const copy = getPhotoRejectionCopy(verdict, t);
        alert(copy.title, copy.message, undefined, { force: true });
        return;
      }

      const uploadResponse = await uploadImage.mutateAsync({
        uid: userId ? String(userId) : undefined,
        photo: asset,
      });

      const uploaded = parseUploadResponse(uploadResponse);
      const uploadedUrl = uploaded.imageUrl || asset.uri;
      const uploadedImageId = uploaded.id;

      if ((selectedIndex === 0 || selectedIndex === null) && uploadedImageId && userId) {
        await setProfilePhoto.mutateAsync({
          uid: String(userId),
          imageId: uploadedImageId,
        });
      }

      updateTargetSlot(uploadedUrl);
      setIsModalVisible(false);
    } catch (error: any) {
      setIsModalVisible(false);

      // A rejected photo is NOT kept in the slot: progression must only happen
      // with photos the back end actually accepted.
      const rejectionKind = getPhotoRejectionKind(error, {
        isPrimary: !uploadedImageCount,
      });
      if (rejectionKind) {
        const copy = getPhotoRejectionCopy(rejectionKind, t);
        alert(copy.title, copy.message, undefined, { force: true });
        return;
      }

      const serverMessage = getUploadErrorMessage(error);
      if (serverMessage) {
        const isLimitError = serverMessage.toLowerCase().includes('images allowed');
        alert(
          isLimitError
            ? t('profile.modaladdphoto.photo_limit_reached')
            : t('profile.profilephotogrid.upload_failed'),
          serverMessage,
          undefined,
          { force: true }
        );
        return;
      }

      const fallbackMessage =
        error?.response?.data?.message ||
        error?.message ||
        t('profile.additionaluploadsection.failed_to_upload_image_to_server');

      // Expected rejections are surfaced in the alert above, not as a dev
      // LogBox error/warning overlay.
      console.log('Upload image failed:', fallbackMessage);
      alert(
        t('profile.profilephotogrid.upload_failed'),
        String(fallbackMessage),
        undefined,
        { force: true }
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Modal visible={isModalVisible} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={() => {
            if (!isUploading) setIsModalVisible(false);
          }}
        >
          <View style={styles.modalBox}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>{t('profile.modaladdphoto.choose_photo_source')}</Text>
            <Text style={styles.modalSubtitle}>{t('profile.modaladdphoto.upload_a_bright_clear_photo_that_looks_like_you')}</Text>

            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={[styles.modalOption, isUploading && styles.modalOptionDisabled]}
                disabled={isUploading}
                onPress={() => {
                  onPickImage('gallery').catch(() => null);
                }}>
                <View style={[styles.iconBox, styles.galleryIconBox]}>
                  <Icon name="image-multiple" size={30} color={Colors.primary} />
                </View>
                <Text style={styles.optionText}>{t('profile.modaladdphoto.gallery')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalOption, isUploading && styles.modalOptionDisabled]}
                disabled={isUploading}
                onPress={() => {
                  onPickImage('camera').catch(() => null);
                }}>
                <View style={[styles.iconBox, styles.cameraIconBox]}>
                  <Icon name="camera-plus" size={30} color={Colors.secondary} />
                </View>
                <Text style={styles.optionText}>{t('profile.modaladdphoto.camera')}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.cancelButton, isUploading && styles.modalOptionDisabled]}
              onPress={() => setIsModalVisible(false)}
              disabled={isUploading}
            >
              <Text style={styles.cancelText}>{t('profile.additionaluploadsection.cancel')}</Text>
            </TouchableOpacity>

            {isUploading && (
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => {}}
                style={styles.uploadingOverlay}
              >
                <ActivityIndicator size="small" color={themeColors.primary} />
                <Text style={styles.uploadingText}>
                  {t('profile.modaladdphoto.uploading', { defaultValue: 'Uploading...' })}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
      {/* Rendered outside the picker modal so rejections are still visible
          after the picker closes. */}
      {AlertComponent}
    </>
  );
};

const createStyles = (themeColors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    modalContainer: {
      flex: 1,
      backgroundColor: Colors.overlay,
      justifyContent: 'flex-end',
    },
    modalBox: {
      backgroundColor: themeColors.surface,
      padding: Spacing.xl,
      borderTopRightRadius: Spacing.radiusXxl,
      borderTopLeftRadius: Spacing.radiusXxl,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: themeColors.border,
      borderBottomWidth: 0,
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: isDark ? themeColors.textMuted : '#CBD5E1',
      borderRadius: 2,
      marginBottom: Spacing.xl,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: themeColors.text,
      marginBottom: Spacing.sm,
    },
    modalSubtitle: {
      fontSize: 14,
      lineHeight: 21,
      color: themeColors.textSecondary,
      textAlign: 'center',
      marginBottom: Spacing.xl,
    },
    optionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
      marginBottom: Spacing.xl,
    },
    modalOption: {
      alignItems: 'center',
      gap: Spacing.sm + 2,
    },
    modalOptionDisabled: {
      opacity: 0.45,
    },
    iconBox: {
      width: 70,
      height: 70,
      borderRadius: 35,
      justifyContent: 'center',
      alignItems: 'center',
    },
    galleryIconBox: {
      backgroundColor: isDark ? themeColors.glass : themeColors.surfaceLight,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    cameraIconBox: {
      backgroundColor: isDark ? themeColors.glass : themeColors.surfaceLight,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    optionText: {
      fontSize: 14,
      fontWeight: '700',
      color: themeColors.textSecondary,
    },
    uploadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      borderTopLeftRadius: Spacing.radiusXxl,
      borderTopRightRadius: Spacing.radiusXxl,
      backgroundColor: isDark ? 'rgba(26, 23, 48, 0.96)' : 'rgba(255, 255, 255, 0.97)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    uploadingText: {
      marginTop: Spacing.sm,
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.textSecondary,
    },
    cancelButton: {
      width: '100%',
      height: 56,
      borderRadius: Spacing.radiusFull,
      backgroundColor: themeColors.inputBackground,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: Spacing.sm + 2,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    cancelText: {
      fontSize: 16,
      fontWeight: '700',
      color: themeColors.text,
    },
  });

export default ModalAddPhoto;
