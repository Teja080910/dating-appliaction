import React, { useCallback, useContext, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
  Alert,
  Button,
  BackHandler,
} from 'react-native';

import AppContext from '../../context/CreateGlobalStateContext';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UploadImage from '../../components/UploadImageComponents/UploadImage';
import ModalAddPhoto from '../../components/UploadImageComponents/ModalAddPhoto';

const UploadPhotosScreen =  ({ navigation }: any) => {
 

  const { images, setImages, isModalVisible, setIsModalVisible, selectedIndex, setSelectedIndex, name, login } = useContext(AppContext);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        AsyncStorage.getItem('isLoggedIn').then((isLoggedIn) => {
          console.log('isLoggedIn', isLoggedIn);
          if (isLoggedIn === 'true') {
            navigation.replace('DisplayName');
          }
          else{
            navigation.replace('DOB');
          }
        });

        return true;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backHandler.remove();
    }, [navigation])
  );
 
  const uploadedImagesCount = images.filter((img: any) => img !== null).length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nice to meet you {name} :-)</Text>
      <Text style={styles.subtitle}>
        Please upload at least 3 photos, including at least one clear picture
        of your face.
      </Text>

      <UploadImage/> 

      <Text style={styles.warning}>
        Please no nudity, filters, text, screenshots, or images without you.
      </Text>

      <TouchableOpacity
        style={[
          styles.nextButton,
          { backgroundColor: uploadedImagesCount >= 3 ? '#d63d4c' : '#ccc' },
        ]}
        disabled={uploadedImagesCount < 3}
        onPress={() => navigation.navigate('AboutProfile')}
      >
        <Text style={styles.nextText}>Next</Text>
      </TouchableOpacity>

      <ModalAddPhoto />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
 
  warning: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 10,
  },
  nextButton: {
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  nextText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default UploadPhotosScreen;
