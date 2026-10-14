import React, { useCallback, useContext, useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import AppContext from '../../context/CreateGlobalStateContext';
import { Colors, useTheme, type ThemeColors } from '../../theme';
import ModalAddPhoto from '../../components/UploadImageComponents/ModalAddPhoto';
import { t, useTranslation } from '../../i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL_STEPS = 8;
const CURRENT_STEP = 4; // Step 4: Photo Upload

const UploadPhotosScreen = ({ navigation }: any) => {
  useTranslation();
  const { themeColors, isDark } = useTheme();
  const colors = themeColors || Colors;
  const styles = useMemo(() => createStyles(themeColors, isDark), [themeColors, isDark]);
  const {
    images = [],
    setImages,
    name,
    setIsModalVisible,
    setSelectedIndex,
  } = useContext(AppContext);

  // We enforce 6 slots
  const slots = [0, 1, 2, 3, 4, 5];

  // Count how many photos are uploaded
  const validImages = Array.isArray(images) ? images.filter(Boolean) : [];
  const uploadedCount = validImages.length;

  // Face validation simulation:
  // If user uploaded photos, we simulate face detection
  // To allow user to test the red warning card or valid state:
  const [faceCheckPassed] = useState(true);

  // Next is enabled if at least 3 photos uploaded and face check passed
  const isNextEnabled = uploadedCount >= 3 && faceCheckPassed;

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.setItem('onboardingStep', 'UploadImage');
      const onBackPress = () => {
        if (navigation.canGoBack()) navigation.goBack();
        else navigation.replace('SelfieVerification');
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, [navigation])
  );

  const handleOpenPicker = (index: number) => {
    setSelectedIndex?.(index);
    setIsModalVisible?.(true);
  };

  const handleRemovePhoto = (index: number) => {
    const updated = Array.isArray(images) ? [...images] : Array(6).fill(null);
    while (updated.length < 6) updated.push(null);
    updated[index] = null;
    setImages?.(updated);
    AsyncStorage.setItem('onboardingImages', JSON.stringify(updated)).catch(() => {});
  };

  const handleNext = async () => {
    if (!isNextEnabled) return;
    const currentSlots = Array.isArray(images) ? [...images] : Array(6).fill(null);
    await AsyncStorage.setItem('onboardingImages', JSON.stringify(currentSlots));
    // Navigate to Step 5: ConnectTelegram
    navigation.navigate('ConnectTelegram');
  };

  const handleBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.replace('SelfieVerification');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Top Header with Back chevron & 8-step progress bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Icon name="chevron-left" size={28} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.progressBar}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressSegment,
                  i + 1 === CURRENT_STEP
                    ? styles.progressSegmentActive
                    : i + 1 < CURRENT_STEP
                    ? styles.progressSegmentDone
                    : styles.progressSegmentInactive,
                ]}
              />
            ))}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title and Instruction */}
          <Text style={styles.headline}>
            Nice to meet you, {name ? name.trim() : 'Xyz'}!
          </Text>
          <Text style={styles.subheadline}>{t('onboarding.uploadimagescreen.please_upload_at_least_3_photos_one_must_clearly_show_your_face')}</Text>

          {/* 6-Slot Photo Grid (2 rows x 3 columns) */}
          <View style={styles.photoGrid}>
            {slots.map((slotIndex) => {
              const imageUri = images && images[slotIndex];
              const isFilled = Boolean(imageUri);

              if (isFilled) {
                return (
                  <View key={slotIndex} style={styles.photoSlotFilled}>
                    <Image source={{ uri: imageUri as string }} style={styles.photoImage} />
                    <TouchableOpacity
                      style={styles.deleteBadge}
                      onPress={() => handleRemovePhoto(slotIndex)}
                      activeOpacity={0.8}
                    >
                      <Icon name="trash-can-outline" size={16} color={isDark ? '#000000' : '#FFFFFF'} />
                    </TouchableOpacity>
                  </View>
                );
              }

              return (
                <TouchableOpacity
                  key={slotIndex}
                  style={styles.photoSlotEmpty}
                  onPress={() => handleOpenPicker(slotIndex)}
                  activeOpacity={0.7}
                >
                  <Icon name="camera-outline" size={32} color={colors.textSecondary} />
                  <View style={styles.addBadge}>
                    <Icon name="plus" size={14} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Warning / Error Banners */}
          {!faceCheckPassed && uploadedCount >= 3 ? (
            // Red Face Error Card (Screenshot 4B)
            <View style={styles.faceErrorCard}>
              <View style={styles.errorIconWrap}>
                <Icon name="close-circle-outline" size={24} color={colors.error || '#EF4444'} />
              </View>
              <Text style={styles.faceErrorText}>{t('onboarding.uploadimagescreen.none_of_your_photos_clearly_shows_your_face_please_upload_a_photo_of_y')}</Text>
            </View>
          ) : (
            // Yellow Policy Banner (Screenshot 4A)
            <View style={styles.nudityWarningCard}>
              <Icon name="alert-outline" size={24} color={isDark ? '#D4A017' : '#D97706'} style={styles.warningIcon} />
              <Text style={styles.nudityWarningText}>{t('onboarding.uploadimagescreen.no_nudity_and_make_sure_you_appear_in_every_photo')}</Text>
            </View>
          )}

          {/* Bottom Next Button */}
          <TouchableOpacity
            style={[
              styles.nextBtn,
              isNextEnabled
                ? { backgroundColor: colors.primary }
                : styles.nextBtnDisabled,
            ]}
            onPress={handleNext}
            disabled={!isNextEnabled}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.nextBtnText,
                !isNextEnabled && styles.nextBtnTextDisabled,
              ]}
            >{t('onboarding.aboutprofilescreen.next')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      <ModalAddPhoto />
    </View>
  );
};

export default UploadPhotosScreen;

const GRID_GAP = 12;
const PADDING_H = 16;
const SLOT_WIDTH = (SCREEN_WIDTH - PADDING_H * 2 - GRID_GAP * 2) / 3;
const SLOT_HEIGHT = SLOT_WIDTH * 1.38;

const createStyles = (themeColors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    safeArea: {
      flex: 1,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    backBtn: {
      width: 36,
      height: 36,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    progressBar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingRight: 32,
    },
    progressSegment: {
      flex: 1,
      height: 3,
      borderRadius: 2,
    },
    progressSegmentActive: {
      backgroundColor: themeColors.text,
      height: 4,
    },
    progressSegmentDone: {
      backgroundColor: themeColors.textSecondary,
    },
    progressSegmentInactive: {
      backgroundColor: isDark ? '#333742' : '#E5E7EB',
    },
    scrollContent: {
      paddingHorizontal: PADDING_H,
      paddingTop: 16,
      paddingBottom: 24,
    },
    headline: {
      color: themeColors.text,
      fontSize: 22,
      fontWeight: '700',
      marginBottom: 8,
    },
    subheadline: {
      color: themeColors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '400',
      marginBottom: 24,
    },
    photoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: GRID_GAP,
      marginBottom: 24,
    },
    photoSlotEmpty: {
      width: SLOT_WIDTH,
      height: SLOT_HEIGHT,
      backgroundColor: isDark ? '#181C25' : themeColors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#222734' : themeColors.border,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    photoSlotFilled: {
      width: SLOT_WIDTH,
      height: SLOT_HEIGHT,
      borderRadius: 12,
      overflow: 'hidden',
      position: 'relative',
    },
    photoImage: {
      width: '100%',
      height: '100%',
      borderRadius: 12,
      resizeMode: 'cover',
    },
    addBadge: {
      position: 'absolute',
      bottom: 8,
      right: 8,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: themeColors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    deleteBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: isDark ? '#FFFFFF' : '#111827',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 3,
    },
    nudityWarningCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#262010' : '#FEF3C7',
      borderWidth: 1,
      borderColor: isDark ? '#4A3B12' : '#FDE68A',
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginBottom: 28,
    },
    warningIcon: {
      marginRight: 14,
    },
    nudityWarningText: {
      flex: 1,
      color: isDark ? '#D4A017' : '#92400E',
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 20,
    },
    faceErrorCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#2E151A' : '#FEE2E2',
      borderWidth: 1,
      borderColor: isDark ? '#542028' : '#FECACA',
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginBottom: 28,
    },
    errorIconWrap: {
      marginRight: 14,
    },
    faceErrorText: {
      flex: 1,
      color: isDark ? '#EF4444' : '#B91C1C',
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 20,
    },
    nextBtn: {
      width: '100%',
      height: 52,
      borderRadius: 26,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#DE4B5B',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    nextBtnDisabled: {
      backgroundColor: isDark ? '#4E2429' : '#E5E7EB',
      shadowOpacity: 0,
      elevation: 0,
    },
    nextBtnText: {
      color: '#FFFFFF',
      fontSize: 17,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    nextBtnTextDisabled: {
      color: isDark ? 'rgba(255, 255, 255, 0.4)' : '#9CA3AF',
    },
  });
