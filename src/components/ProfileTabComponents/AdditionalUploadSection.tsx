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
import Icon from 'react-native-vector-icons/Feather';

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
    <View style={styles.container}>
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
                  <Icon name="camera" size={24} color="#777" />
                  <View style={styles.plusBadge}>
                    <Icon name="plus" size={12} color="#fff" />
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.badgeWrapper}>
        <PhotoVerifiedBadge />
      </View>
    </View>
  );
};

export default AdditionalUploadSection;

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
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
    paddingHorizontal: 10,
  },
  imageBox: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '1.5%', // Gives approx 3 items per row evenly
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e6e6e6',
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  plusBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#E94057',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  badgeWrapper: {
    alignItems: 'center',
    marginTop: 20,
  },
});
