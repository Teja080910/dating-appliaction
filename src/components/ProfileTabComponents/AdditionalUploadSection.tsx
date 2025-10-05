
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import React, { useContext } from 'react';
import AppContext from '../../context/CreateGlobalStateContext';
import PhotoVerifiedBadge from './PhotoVerifiedBadge';
import { launchImageLibrary } from 'react-native-image-picker';

const AdditionalUploadSection = () => {
  const {
    images,
    profileImage,
    setProfileImage,
    setSelectedIndex,
    setIsModalVisible,
    setImages,
  } = useContext(AppContext);

  const onPressImage = async (index: number) => {
    const currentImage = images[index];

    // Count how many images are non-empty
    const totalImages = images.filter(img => img && img.trim() !== '').length;

    if (currentImage && currentImage.trim() !== '') {
      // REMOVE CASE
      if (totalImages === 1) {
        Alert.alert(
          'Hold on!',
          "At least one photo must remain. You can't remove your only profile picture."
        );
        return;
      }

      const newImages = [...images];
      newImages[index] = null;
      setImages(newImages);

      if (profileImage === currentImage) {
        setProfileImage(null);
      }

      setSelectedIndex(null);
      setIsModalVisible(false);
    } else {
      // UPLOAD CASE
      const result = await launchImageLibrary({ mediaType: 'photo' });

      if (result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        if (uri) {
          const updatedImages = [...images];
          updatedImages[index] = uri;
          setImages(updatedImages);

          if (!profileImage) {
            setProfileImage(uri);
          }
        }
      }

      setIsModalVisible(false);
    }
  };

  return (
    <View>
      <Text style={styles.textPhoto}>PHOTOS</Text>

      <View style={styles.grid}>
        {Array.from({ length: 6 }).map((_, i) => {
          const imageUri = images[i];

          return (
            <TouchableOpacity
              key={i}
              style={styles.imageBox}
              onPress={() => onPressImage(i)}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.uploadedImage} />
              ) : (
                <View style={styles.iconContainer}>
                  <Text style={styles.cameraIcon}>📷</Text>
                  <View style={styles.plusBadge}>
                    <Text style={styles.plusText}>+</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        <PhotoVerifiedBadge />
      </View>
    </View>
  );
};

export default AdditionalUploadSection;

const styles = StyleSheet.create({
  textPhoto: {
    fontSize: 13,
    fontWeight: '600',
    color: '#a0a0a0',
    marginBottom: 10,
    padding: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 10,
  },
  imageBox: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    overflow: 'hidden',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  cameraIcon: {
    fontSize: 28,
    color: '#333',
  },
  plusBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#d63d4c',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
