import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import AppContext from '../../context/CreateGlobalStateContext';
import Icon from 'react-native-vector-icons/Feather';
import { mapImagesToSlots, MAX_PROFILE_IMAGES, useUserImages } from '../../api/useImages';
import { getAuthSession } from '../../utils/session';
import { isResolvedApiUserId } from '../../utils/sessionState';
import { getAuthToken } from '../../utils/sessionHelper';
import { getUserId } from '../../utils/sessionHelper';
import { Colors, Spacing } from '../../theme';
import { useAlert } from '../AlertModal';
import { isApiHostedUrl } from '../../api/apiClient';

const UploadImage = () => {
  const { alert, AlertComponent } = useAlert();
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
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [tokenReady, setTokenReady] = useState(false);
  const [loadingImages, setLoadingImages] = useState(true);
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
        alert('Image Sync Failed', String(message));
      },
    });
  }, [getAllImages, setImages, setProfileImage, setProfileImageUrl]);

  useEffect(() => {
    const init = async () => {
      const token = await getAuthToken();
      if (token) {
        setAuthToken(token);
        setTokenReady(true);
      }

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

  useEffect(() => {
    if (!authToken || !localUserId) return;
    syncImagesFromServer(localUserId);
  }, [authToken]);

  useEffect(() => {
    if (!images || images.every(i => !i)) {
      setLoadingImages(false);
      return;
    }
    if (!authToken) return;
    const timer = setTimeout(() => setLoadingImages(false), 800);
    return () => clearTimeout(timer);
  }, [images, authToken]);

  const openImageOptions = (index: number) => {
    if (!images?.[index] && visibleImages.filter(Boolean).length >= MAX_PROFILE_IMAGES) {
      alert(
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

    alert('Remove Photo', 'Do you want to delete this photo from the server?', [
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
              alert('Delete Failed', String(message));
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
                <Image
                  key={`img-${index}-${tokenReady}`}
                  source={
                    authToken && isApiHostedUrl(img)
                      ? { uri: `${img}${img.includes('?') ? '&' : '?'}_t=${Date.now()}`, headers: { Authorization: `Bearer ${authToken}` } }
                      : { uri: img }
                  }
                  style={styles.image}
                  resizeMode="cover"
                />
                {loadingImages && (
                  <View style={styles.imageLoader}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                  </View>
                )}
                <TouchableOpacity
                  style={styles.deleteBadge}
                  onPress={() => removeImage(index)}
                >
                  <Icon name="x" size={12} color={Colors.white} />
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.iconContainer}>
                <View style={styles.cameraIconWrapper}>
                  <Icon name="camera" size={24} color={Colors.primary} />
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
      {AlertComponent}
    </View>
  );
};

export default UploadImage;

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginTop: Spacing.sm + 2,
    marginHorizontal: -6,
  },
  imageWrapper: {
    width: '33.33%',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: 6,
  },
  slotHeader: {
    width: '100%',
    marginBottom: Spacing.sm,
  },
  slotLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textAlign: 'left',
  },
  imageBox: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.inputBackground,
    borderRadius: Spacing.radiusLg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    position: 'relative',
    overflow: 'visible',
  },
  mainIndicator: {
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    backgroundColor: Colors.glass,
  },
  mainActive: {
    borderColor: Colors.primary,
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
    backgroundColor: Colors.primary,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  deleteBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.black,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
    zIndex: 10,
  },
  plusText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  addLabel: {
    marginTop: Spacing.sm,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: Spacing.radiusMd,
  },
  imageLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: Spacing.radiusMd,
  },
});
