import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import AppContext from '../../context/CreateGlobalStateContext';
import Icon from 'react-native-vector-icons/Feather';
import { mapImagesToSlots, MAX_PROFILE_IMAGES, useUserImages } from '../../api/useImages';
import { getAuthSession } from '../../utils/session';
import { isResolvedApiUserId } from '../../utils/sessionState';
import { getUserId } from '../../utils/sessionHelper';

const UploadImage = () => {
  const {
    images,
    setImages,
    setSelectedIndex,
    setIsModalVisible,
    setProfileImage,
    setProfileImageUrl,
    authUserId,
    setAuthUserId,
  } = useContext(AppContext);

  const { getAllImages, deleteImage } = useUserImages();
  const [localUserId, setLocalUserId] = useState<string | null>(null);
  const [imageMap, setImageMap] = useState<Record<number, number>>({});
  const visibleImages = Array.from({ length: MAX_PROFILE_IMAGES }, (_, index) => images?.[index] || null);

  const resolveActiveUserId = useCallback(async () => {
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
  }, [authUserId]);

  const syncImagesFromServer = useCallback((uid?: string | null) => {
    getAllImages.mutate(uid || undefined, {
      onSuccess: (response) => {
        const mapped = mapImagesToSlots(response);
        setImages(mapped.slots);
        setImageMap(mapped.imageIdByIndex);
        setProfileImage(mapped.profileImageUrl);
        setProfileImageUrl(mapped.profileImageUrl);
      },
      onError: (error: any) => {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          'Unable to load your uploaded images.';
        Alert.alert('Image Sync Failed', String(message));
      },
    });
  }, [getAllImages, setImages, setProfileImage, setProfileImageUrl]);

  const hasSynced = React.useRef(false);

  useEffect(() => {
    if (hasSynced.current) return;
    hasSynced.current = true;

    const init = async () => {
      const uid = await resolveActiveUserId();
      if (uid) {
        const userId = String(uid);
        setLocalUserId(userId);
        setAuthUserId?.(userId);
        syncImagesFromServer(userId);
        return;
      }

      syncImagesFromServer();
    };

    init().catch(() => null);
  }, []);

  const openImageOptions = (index: number) => {
    if (!images?.[index] && visibleImages.filter(Boolean).length >= MAX_PROFILE_IMAGES) {
      Alert.alert(
        'Photo Limit Reached',
        'You already have 5 photos saved. Delete one photo before adding another.'
      );
      return;
    }

    setSelectedIndex(index);
    setIsModalVisible(true);
  };

  const removeImage = (index: number) => {
    const imageId = imageMap[index];

    if (!imageId) {
      const nextImages = [...images];
      nextImages[index] = null;
      setImages(nextImages);
      return;
    }

    Alert.alert('Remove Photo', 'Do you want to delete this photo from the server?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteImage.mutate(imageId, {
            onSuccess: () => {
              syncImagesFromServer(localUserId);
            },
            onError: (error: any) => {
              const message =
                error?.response?.data?.message ||
                error?.message ||
                'Failed to delete image from server.';
              Alert.alert('Delete Failed', String(message));
            },
          });
        },
      },
    ]);
  };

  return (
    <View style={styles.grid}>
      {visibleImages.map((img: string | null, index: number) => (
        <View key={index} style={styles.imageWrapper}>
          <View style={styles.slotHeader}>
            <Text style={styles.slotLabel}>
              {index === 0 ? 'Main photo' : `Photo ${index + 1}`}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.imageBox,
              index === 0 && !img && styles.mainIndicator,
              index === 0 && img && styles.mainActive,
            ]}
            onPress={() => openImageOptions(index)}>
            {img ? (
              <>
                <Image source={{ uri: img }} style={styles.image} />
                <TouchableOpacity
                  style={styles.deleteBadge}
                  onPress={() => removeImage(index)}
                >
                  <Icon name="x" size={12} color="#fff" />
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.iconContainer}>
                <View style={styles.cameraIconWrapper}>
                  <Icon name="camera" size={24} color="#FF5A79" />
                  <View style={styles.plusBadge}>
                    <Text style={styles.plusText}>+</Text>
                  </View>
                </View>
                <Text style={styles.addLabel}>Add photo</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

export default UploadImage;

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginTop: 10,
    marginHorizontal: -6,
  },
  imageWrapper: {
    width: '33.33%',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 6,
  },
  slotHeader: {
    width: '100%',
    marginBottom: 8,
  },
  slotLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7A7076',
    textAlign: 'left',
  },
  imageBox: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0E3E8',
    position: 'relative',
    overflow: 'visible',
  },
  mainIndicator: {
    borderColor: '#FF5A79',
    borderStyle: 'dashed',
    backgroundColor: '#FFF5F6',
  },
  mainActive: {
    borderColor: '#FF5A79',
    borderWidth: 2,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIconWrapper: {
    position: 'relative',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusBadge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: '#FF5A79',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  deleteBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#333',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 10,
  },
  plusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  addLabel: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '700',
    color: '#C64D6D',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
});
