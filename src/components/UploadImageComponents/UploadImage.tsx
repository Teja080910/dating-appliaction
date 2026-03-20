import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useContext } from 'react';
import AppContext from '../../context/CreateGlobalStateContext';
import Icon from 'react-native-vector-icons/Feather';

const UploadImage = () => {
  const { images, setImages, setSelectedIndex, setIsModalVisible } = useContext(AppContext);

  const openImageOptions = (index: number) => {
    setSelectedIndex(index);
    setIsModalVisible(true);
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages[index] = null;
    setImages(newImages);
  };

  return (
    <View style={styles.grid}>
      {images.map((img, index) => (
        <View key={index} style={styles.imageWrapper}>
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
                <Icon name="camera" size={24} color="#FF5A79" />
                <View style={styles.plusBadge}>
                  <Text style={styles.plusText}>+</Text>
                </View>
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
    justifyContent: 'space-between',
    marginTop: 10,
  },
  imageWrapper: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 15,
  },
  imageBox: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
    position: 'relative',
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
  plusBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#FF5A79',
    width: 20,
    height: 20,
    borderRadius: 10,
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
    fontSize: 12,
    fontWeight: 'bold',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
});
