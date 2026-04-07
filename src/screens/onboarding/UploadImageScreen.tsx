import React, { useCallback, useContext, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  BackHandler,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppContext from '../../context/CreateGlobalStateContext';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UploadImage from '../../components/UploadImageComponents/UploadImage';
import ModalAddPhoto from '../../components/UploadImageComponents/ModalAddPhoto';
import Icon from 'react-native-vector-icons/Feather';

const UploadPhotosScreen = ({ navigation }: any) => {
  const {
    images = [],
    name,
  } = useContext(AppContext);

  const [showFaceAlert, setShowFaceAlert] = useState(false);

  // ✅ Handle back + save step
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.setItem('onboardingStep', 'UploadImage');

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

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => backHandler.remove();
    }, [navigation])
  );

  // ✅ Safe image count
  const uploadedImagesCount = images?.filter((img: any) => !!img)?.length || 0;
  const isNextEnabled = uploadedImagesCount >= 3;
  const remainingRequiredPhotos = Math.max(0, 3 - uploadedImagesCount);

  // ✅ Next button logic
  const handleNext = () => {
    if (uploadedImagesCount < 3) {
      Alert.alert(
        'Upload Required',
        'Please upload at least 3 photos before continuing.'
      );
      return;
    }
    setShowFaceAlert(true);
  };

  // ✅ Confirm dialog
  const handleConfirm = () => {
    setShowFaceAlert(false);
    navigation.navigate('SelfieVerification');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarFill} />
        </View>

        <View style={styles.heroCard}>
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>{uploadedImagesCount}/5 uploaded</Text>
          </View>

          <Text style={styles.title}>
            Nice to meet you, {name || 'there'}.
          </Text>

          <Text style={styles.subtitle}>
            Add at least <Text style={styles.bold}>3 photos</Text>, including one clear face photo.
          </Text>

          <Text style={styles.helperText}>
            {remainingRequiredPhotos > 0
              ? `${remainingRequiredPhotos} more photo${remainingRequiredPhotos === 1 ? '' : 's'} needed to continue.`
              : 'You are ready for the next step.'}
          </Text>
        </View>

        <UploadImage />

        <View style={styles.tipCard}>
          <View style={styles.warningRow}>
            <Icon name="info" size={14} color="#FF5A79" />
            <Text style={styles.warning}>
              Your first photo should be your main profile photo.
            </Text>
          </View>

          <View style={styles.warningRow}>
            <Icon name="shield" size={14} color="#FF5A79" />
            <Text style={styles.warning}>
              Avoid nudity, heavy filters, screenshots, text overlays, or group-only photos.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            { backgroundColor: isNextEnabled ? '#FF5A79' : '#E8E8EC' }
          ]}
          disabled={!isNextEnabled}
          onPress={handleNext}
        >
          <Text
            style={[
              styles.nextText,
              { color: isNextEnabled ? '#fff' : '#8E8E93' }
            ]}
          >
            Next
          </Text>
        </TouchableOpacity>
      </View>

      <ModalAddPhoto />

      <Modal visible={showFaceAlert} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>One quick check</Text>

            <Text style={styles.alertMessage}>
              Confirm that your main picture clearly shows your face.
            </Text>

            <TouchableOpacity
              style={styles.alertButton}
              onPress={handleConfirm}
            >
              <Text style={styles.alertButtonText}>Continue</Text>
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
    backgroundColor: '#FFF8FA',
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  progressBarContainer: {
    height: 5,
    backgroundColor: '#F2D7DF',
    marginTop: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '80%',
    height: '100%',
    backgroundColor: '#FF5A79',
  },
  heroCard: {
    marginTop: 18,
    marginBottom: 18,
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F5D7DF',
  },
  countPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFF0F4',
    marginBottom: 14,
  },
  countPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D63A61',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    color: '#161218',
  },
  subtitle: {
    fontSize: 15,
    color: '#5F5563',
    lineHeight: 23,
  },
  bold: {
    fontWeight: '800',
    color: '#FF5A79',
  },
  helperText: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 20,
    color: '#8A7E86',
  },
  tipCard: {
    marginTop: 6,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F4E8EC',
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
  },
  warning: {
    fontSize: 13,
    lineHeight: 19,
    color: '#6B6268',
    marginLeft: 10,
    flex: 1,
  },
  bottomContainer: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  nextButton: {
    paddingVertical: 17,
    borderRadius: 50,
    alignItems: 'center',
    shadowColor: '#FF5A79',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  nextText: {
    fontWeight: '800',
    fontSize: 17,
  },
  overlay: {
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
  },
  alertTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#161218',
    marginBottom: 10,
  },
  alertMessage: {
    fontSize: 16,
    lineHeight: 23,
    color: '#4D434B',
    marginBottom: 25,
  },
  alertButton: {
    backgroundColor: '#FF5A79',
    paddingVertical: 12,
    borderRadius: 30,
  },
  alertButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
});

export default UploadPhotosScreen;
