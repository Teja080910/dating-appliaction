import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React, { useContext } from 'react';
import AppContext from '../../context/CreateGlobalStateContext';
// import openImageOptions from '../../screens/onboarding/UploadImageScreen'

const UploadImage = () => {
  const {images, setImages, setSelectedIndex, setIsModalVisible} = useContext(AppContext);
  const openImageOptions = (index: number) => {
    setSelectedIndex(index);
    setIsModalVisible(true);
  };

  return (
    <View style={styles.grid}>
      {images.map((img, index) => (
        <TouchableOpacity
          key={index}
          style={styles.imageBox}
          onPress={() => openImageOptions(index)}>
          {img ? (
            <Image source={{uri: img}} style={styles.image} />
          ) : (
            <View style={styles.iconContainer}>
              <Text style={styles.cameraIcon}>📷</Text>
              <View style={styles.plusBadge}>
                <Text style={styles.plusText}>+</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
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
  },
  imageBox: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#f2f2f2',
    marginVertical: 10,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    fontSize: 24,
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
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
});





