import React, { useCallback, useContext, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  BackHandler,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import AppContext from '../../context/CreateGlobalStateContext';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UploadImage from '../../components/UploadImageComponents/UploadImage';
import ModalAddPhoto from '../../components/UploadImageComponents/ModalAddPhoto';
import Icon from 'react-native-vector-icons/Feather';
import { Colors, Spacing, Shadows } from '../../theme';
import { useAlert } from '../../components/AlertModal';

const UploadPhotosScreen = ({ navigation }: any) => {
  const {
    images = [],
    name,
  } = useContext(AppContext);

  const [showFaceAlert, setShowFaceAlert] = useState(false);
  const { alert, AlertComponent } = useAlert();

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

  const uploadedImagesCount = images?.filter((img: any) => !!img)?.length || 0;
  const isNextEnabled = uploadedImagesCount >= 3;
  const remainingRequiredPhotos = Math.max(0, 3 - uploadedImagesCount);

  const handleNext = () => {
    if (uploadedImagesCount < 3) {
      alert(
        'Upload Required',
        'Please upload at least 3 photos before continuing.'
      );
      return;
    }
    setShowFaceAlert(true);
  };

  const handleConfirm = () => {
    setShowFaceAlert(false);
    navigation.navigate('SelfieVerification');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={[Colors.background, Colors.surface]} style={styles.gradient}>
        <SafeAreaView style={styles.safeArea}>
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
                <Icon name="info" size={14} color={Colors.primary} />
                <Text style={styles.warning}>
                  Your first photo should be your main profile photo.
                </Text>
              </View>

              <View style={styles.warningRow}>
                <Icon name="shield" size={14} color={Colors.primary} />
                <Text style={styles.warning}>
                  Avoid nudity, heavy filters, screenshots, text overlays, or group-only photos.
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.bottomContainer}>
            <TouchableOpacity
              style={[styles.nextButton, !isNextEnabled && styles.nextButtonDisabled]}
              disabled={!isNextEnabled}
              onPress={handleNext}
            >
              <LinearGradient
                colors={isNextEnabled ? [Colors.primary, Colors.secondary] : [Colors.disabled, Colors.disabled]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.nextGradient}
              >
                <Text style={[styles.nextText, !isNextEnabled && styles.nextTextDisabled]}>
                  Next
                </Text>
              </LinearGradient>
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
                  <LinearGradient
                    colors={[Colors.primary, Colors.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.alertGradient}
                  >
                    <Text style={styles.alertButtonText}>Continue</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
        {AlertComponent}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: {
    paddingBottom: 24,
    paddingHorizontal: Spacing.screenPaddingHorizontal,
  },
  progressBarContainer: {
    height: 5,
    backgroundColor: Colors.surfaceLighter,
    marginTop: Spacing.md,
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '80%',
    height: '100%',
    backgroundColor: Colors.primary,
  },
  heroCard: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: Spacing.radiusXxl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  countPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.radiusFull,
    backgroundColor: Colors.glass,
    marginBottom: Spacing.md,
  },
  countPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryLight,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: Spacing.sm,
    color: Colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 23,
  },
  bold: {
    fontWeight: '800',
    color: Colors.primary,
  },
  helperText: {
    marginTop: Spacing.md,
    fontSize: 13,
    lineHeight: 20,
    color: Colors.textMuted,
  },
  tipCard: {
    marginTop: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: Spacing.radiusXl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.sm,
  },
  warning: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm + 2,
    flex: 1,
  },
  bottomContainer: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.screenPaddingHorizontal,
  },
  nextButton: {
    borderRadius: Spacing.radiusFull,
    overflow: 'hidden',
    ...Shadows.md,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextGradient: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: {
    fontWeight: '800',
    fontSize: 17,
    color: Colors.white,
  },
  nextTextDisabled: {
    color: Colors.disabledText,
  },
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radiusXxl,
    padding: Spacing.xl,
    width: '85%',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  alertTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.sm + 2,
  },
  alertMessage: {
    fontSize: 16,
    lineHeight: 23,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  alertButton: {
    borderRadius: Spacing.radiusFull,
    overflow: 'hidden',
  },
  alertGradient: {
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
    textAlign: 'center',
  },
});

export default UploadPhotosScreen;
