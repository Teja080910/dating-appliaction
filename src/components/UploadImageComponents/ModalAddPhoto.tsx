import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useContext, useMemo } from 'react';
import AppContext from '../../context/CreateGlobalStateContext';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, useTheme, type ThemeColors } from '../../theme';
import { requestPermissions } from '../../utils/types/permission';
import { MAX_PROFILE_IMAGES, useUserImages } from '../../api/useImages';
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
        'Photo Limit Reached',
        'You already have 5 photos saved. Delete one photo before adding another.'
      );
      setIsModalVisible(false);
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      alert('Permission Required', 'Please allow camera or photo library access to continue.');
      return;
    }

    const pickerResult =
      type === 'camera'
        ? await launchCamera({ mediaType: 'photo', quality: 0.4, maxWidth: 720, maxHeight: 960 })
        : await launchImageLibrary({ mediaType: 'photo', quality: 0.4, maxWidth: 720, maxHeight: 960 });

    const asset = pickerResult.assets?.[0];
    if (!asset?.uri) {
      if (pickerResult.errorMessage) {
        alert('Image Error', pickerResult.errorMessage);
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

      if (targetIndex === 0 || !images?.[0]) {
        setProfileImage(imageUrl);
        setProfileImageUrl(imageUrl);
        AsyncStorage.setItem('profileImage', imageUrl).catch(() => {});
      }
    };

    try {
      const uploadResponse = await uploadImage.mutateAsync({
        uid: userId ? String(userId) : undefined,
        photo: asset,
      });

      const uploadedUrl =
        uploadResponse?.imageUrl ||
        uploadResponse?.data?.imageUrl ||
        uploadResponse?.url ||
        asset.uri;

      const uploadedImageId =
        typeof uploadResponse?.id === 'number'
          ? uploadResponse.id
          : typeof uploadResponse?.data?.id === 'number'
            ? uploadResponse.data.id
            : null;

      if ((selectedIndex === 0 || selectedIndex === null) && uploadedImageId && userId) {
        await setProfilePhoto.mutateAsync({
          uid: String(userId),
          imageId: uploadedImageId,
        });
      }

      updateTargetSlot(uploadedUrl);
      setIsModalVisible(false);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t('profile.additionaluploadsection.failed_to_upload_image_to_server');

      // Keep user's chosen local photo in the slot even if server call failed
      updateTargetSlot(asset.uri);
      setIsModalVisible(false);

      if (String(message).toLowerCase().includes('max 5 images allowed')) {
        alert(
          'Photo Limit Reached',
          'You already have 5 photos saved on the server. Delete one photo before adding another.'
        );
        return;
      }

      console.warn('Upload image warning:', message);
    }
  };

  return (
    <Modal visible={isModalVisible} transparent animationType="slide">
      <TouchableOpacity
        style={styles.modalContainer}
        activeOpacity={1}
        onPress={() => setIsModalVisible(false)}
      >
        <View style={styles.modalBox}>
          <View style={styles.handle} />
          <Text style={styles.modalTitle}>{t('profile.modaladdphoto.choose_photo_source')}</Text>
          <Text style={styles.modalSubtitle}>{t('profile.modaladdphoto.upload_a_bright_clear_photo_that_looks_like_you')}</Text>

          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                onPickImage('gallery').catch(() => null);
              }}>
              <View style={[styles.iconBox, styles.galleryIconBox]}>
                <Icon name="image-multiple" size={30} color={Colors.primary} />
              </View>
              <Text style={styles.optionText}>{t('profile.modaladdphoto.gallery')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
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
            style={styles.cancelButton}
            onPress={() => setIsModalVisible(false)}
          >
            <Text style={styles.cancelText}>{t('profile.additionaluploadsection.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
      {AlertComponent}
    </Modal>
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
