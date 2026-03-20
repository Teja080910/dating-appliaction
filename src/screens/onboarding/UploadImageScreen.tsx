import React, {useCallback, useContext, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
  Alert,
  BackHandler,
  StatusBar,
  SafeAreaView,
} from 'react-native';

import AppContext from '../../context/CreateGlobalStateContext';
import {useFocusEffect} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UploadImage from '../../components/UploadImageComponents/UploadImage';
import ModalAddPhoto from '../../components/UploadImageComponents/ModalAddPhoto';
import Icon from 'react-native-vector-icons/Feather';

const UploadPhotosScreen = ({navigation}: any) => {
  const {
    images,
    setImages,
    isModalVisible,
    setIsModalVisible,
    selectedIndex,
    setSelectedIndex,
    name,
    login,
  } = useContext(AppContext);

  const [showFaceAlert, setShowFaceAlert] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        AsyncStorage.getItem('isLoggedIn').then(isLoggedIn => {
          if (isLoggedIn === 'true') {
            navigation.replace('DisplayName');
          } else {
            navigation.replace('DOB');
          }
        });
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );
      return () => backHandler.remove();
    }, [navigation]),
  );

  const uploadedImagesCount = images.filter(
    (img: any) => img !== null,
  ).length;

  const handleNext = () => {
    // Revert to 3 photo requirement
    if (uploadedImagesCount < 3) {
      Alert.alert("More Photos Required", "Please upload at least 3 photos, including at least one clear picture of your face.", [{ text: "OK" }]);
      return;
    }

    // Show face alert dialog
    setShowFaceAlert(true);
  };

  const handleFaceAlertOk = () => {
    setShowFaceAlert(false);
    navigation.navigate('FaceVerification');
  };

  const isNextEnabled = uploadedImagesCount >= 3;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarFill} />
      </View>

      {/* Title */}
      <Text style={styles.title}>Nice to meet you {name} :-)</Text>
      <Text style={styles.subtitle}>
        Please upload at least <Text style={styles.bold}>3 photos</Text>, including at least one clear picture of your face.
      </Text>

      {/* Photo Grid */}
      <UploadImage />

      {/* Warning */}
      <View style={styles.warningRow}>
        <Icon name="info" size={14} color="#999" style={{marginTop: 2}} />
        <Text style={styles.warning}>
          Please no nudity, filters, text, screenshots, or images without you.
        </Text>
      </View>

      {/* Next Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            { backgroundColor: isNextEnabled ? '#FF5A79' : '#e0e0e0' }
          ]}
          disabled={!isNextEnabled}
          onPress={handleNext}>
          <Text style={[styles.nextText, { color: isNextEnabled ? '#fff' : '#999' }]}>Next</Text>
        </TouchableOpacity>
      </View>

      {/* Modal for picking image */}
      <ModalAddPhoto />

      {/* Glambu-style Face Alert Dialog */}
      <Modal visible={showFaceAlert} transparent animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>AMARA</Text>
            <Text style={styles.alertMessage}>
              Confirm that your main picture shows your full face clearly.
            </Text>
            <TouchableOpacity
              style={styles.alertButton}
              onPress={handleFaceAlertOk}>
              <Text style={styles.alertButtonText}>CONFIRM</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  progressBarContainer: {
    height: 5,
    backgroundColor: '#eee',
    marginTop: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '80%',
    height: '100%',
    backgroundColor: '#FF5A79',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 25,
    marginBottom: 8,
    color: '#000',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  bold: {
    fontWeight: 'bold',
    color: '#FF5A79',
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 15,
  },
  warning: {
    fontSize: 12,
    color: '#999',
    flex: 1,
  },
  bottomContainer: {
    marginTop: 'auto',
    paddingBottom: 30,
  },
  nextButton: {
    padding: 16,
    borderRadius: 50,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  nextText: {
    fontWeight: '700',
    fontSize: 18,
  },
  // Alert Dialog Styles (Glambu-style)
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: {width: 0, height: 10},
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FF5A79',
    marginBottom: 12,
    letterSpacing: 2,
  },
  alertMessage: {
    fontSize: 16,
    color: '#333',
    marginBottom: 25,
    lineHeight: 24,
  },
  alertButton: {
    backgroundColor: '#FF5A79',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignSelf: 'center',
    width: '100%',
  },
  alertButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
});

export default UploadPhotosScreen;
