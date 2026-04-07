import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useContext } from 'react';
import AppContext from '../../context/CreateGlobalStateContext';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../utils/colors';
import { requestPermissions } from '../../utils/types/permission';
import { mapImagesToSlots, MAX_PROFILE_IMAGES, useUserImages } from '../../api/useImages';
import { getAuthSession, isResolvedApiUserId } from '../../utils/session';
import { getUserId } from '../../utils/sessionHelper';

const ModalAddPhoto = () => {
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

  const { uploadImage, getAllImages, setProfilePhoto } = useUserImages();
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

  const syncImages = async (uid?: string | null) => {
    const response = await getAllImages.mutateAsync(uid || undefined);
    const mapped = mapImagesToSlots(response);
    setImages(mapped.slots);
    setProfileImage(mapped.profileImageUrl);
    setProfileImageUrl(mapped.profileImageUrl);
  };

  const onPickImage = async (type: 'camera' | 'gallery') => {
    const targetIndex =
      typeof selectedIndex === 'number' && selectedIndex >= 0 ? selectedIndex : 0;
    const isReplacingExisting = Boolean(images?.[targetIndex]);

    if (!isReplacingExisting && uploadedImageCount >= MAX_PROFILE_IMAGES) {
      Alert.alert(
        'Photo Limit Reached',
        'You already have 5 photos saved. Delete one photo before adding another.'
      );
      setIsModalVisible(false);
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Please allow camera or photo library access to continue.');
      return;
    }

    const pickerResult =
      type === 'camera'
        ? await launchCamera({ mediaType: 'photo', quality: 0.4, maxWidth: 720, maxHeight: 960 })
        : await launchImageLibrary({ mediaType: 'photo', quality: 0.4, maxWidth: 720, maxHeight: 960 });

    const asset = pickerResult.assets?.[0];
    if (!asset?.uri) {
      if (pickerResult.errorMessage) {
        Alert.alert('Image Error', pickerResult.errorMessage);
      }
      setIsModalVisible(false);
      return;
    }

    const userId = await resolveActiveUserId();
    if (userId) {
      setAuthUserId?.(String(userId));
    }

    try {
      const uploadResponse = await uploadImage.mutateAsync({
        uid: userId ? String(userId) : undefined,
        photo: asset,
      });

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

      await syncImages(userId);
      setIsModalVisible(false);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to upload image to server.';

      await syncImages(userId);
      setIsModalVisible(false);

      if (String(message).toLowerCase().includes('max 5 images allowed')) {
        Alert.alert(
          'Photo Limit Reached',
          'You already have 5 photos saved on the server. Delete one photo before adding another.'
        );
        return;
      }

      Alert.alert('Upload Failed', String(message));
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
          <Text style={styles.modalTitle}>Choose Photo Source</Text>
          <Text style={styles.modalSubtitle}>
            Upload a bright, clear photo that looks like you.
          </Text>

          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                onPickImage('gallery').catch(() => null);
              }}>
              <View style={[styles.iconBox, styles.galleryIconBox]}>
                <Icon name="image-multiple" size={30} color="#2196f3" />
              </View>
              <Text style={styles.optionText}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                onPickImage('camera').catch(() => null);
              }}>
              <View style={[styles.iconBox, styles.cameraIconBox]}>
                <Icon name="camera-plus" size={30} color={Colors.pink} />
              </View>
              <Text style={styles.optionText}>Camera</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setIsModalVisible(false)}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default ModalAddPhoto;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#fff',
    padding: 25,
    borderTopRightRadius: 30,
    borderTopLeftRadius: 30,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#221A1F',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: '#7B7076',
    textAlign: 'center',
    marginBottom: 28,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 30,
  },
  modalOption: {
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryIconBox: {
    backgroundColor: '#e3f2fd',
  },
  cameraIconBox: {
    backgroundColor: '#fce4ec',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5A5257',
  },
  cancelButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7B7076',
  },
});
