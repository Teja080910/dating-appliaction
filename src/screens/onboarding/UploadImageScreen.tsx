import React, { useCallback, useContext, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UploadImage from '../../components/UploadImageComponents/UploadImage';
import ModalAddPhoto from '../../components/UploadImageComponents/ModalAddPhoto';
import { profileApi } from '../../api/profileApi';
import { AuthStorage } from '../../api/authStorage';

const UploadPhotosScreen = ({ navigation }: any) => {
  const { images, name } = useContext(AppContext);
  const [uploading, setUploading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        AsyncStorage.getItem('isLoggedIn').then((isLoggedIn) => {
          if (isLoggedIn === 'true') {
            navigation.replace('DisplayName');
          } else {
            navigation.replace('DOB');
          }
        });
        return true;
      };
      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backHandler.remove();
    }, [navigation])
  );

  const uploadedImagesCount = images.filter((img: any) => img && typeof img === 'string').length;

  const handleNext = async () => {
    setUploading(true);
    try {
      const userIdStr = await AuthStorage.getUserIdStr();
      if (userIdStr) {
        for (const img of images) {
          if (img) {
            try {
              await profileApi.uploadImage(userIdStr, {
                uri: img,
                type: 'image/jpeg',
                fileName: 'photo.jpg',
              });
            } catch {}
          }
        }

        const allImages = await profileApi.getAllImages(userIdStr);
        const imgList = allImages?.data || allImages?.images || allImages;
        if (Array.isArray(imgList) && imgList.length > 0) {
          const imgId = imgList[imgList.length - 1].id;
          if (imgId) {
            try {
              await profileApi.setProfilePhoto(userIdStr, imgId);
            } catch {}
          }
        }
      }
    } catch {}
    setUploading(false);
    navigation.navigate('AboutProfile');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nice to meet you {name} :-)</Text>
      <Text style={styles.subtitle}>
        Please upload at least 3 photos, including at least one clear picture
        of your face.
      </Text>

      <UploadImage />

      <Text style={styles.warning}>
        Please no nudity, filters, text, screenshots, or images without you.
      </Text>

      <TouchableOpacity
        style={[
          styles.nextButton,
          { backgroundColor: uploadedImagesCount >= 3 && !uploading ? '#d63d4c' : '#ccc' },
        ]}
        disabled={uploadedImagesCount < 3 || uploading}
        onPress={handleNext}>
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.nextText}>Next</Text>
        )}
      </TouchableOpacity>

      <ModalAddPhoto />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginVertical: 10 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  warning: { fontSize: 12, color: '#aaa', marginTop: 10 },
  nextButton: { padding: 15, borderRadius: 30, alignItems: 'center', marginTop: 20 },
  nextText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});

export default UploadPhotosScreen;
