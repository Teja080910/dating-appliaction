import React, { useContext, useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  ScrollView,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';

import EthnicitySelector from '../../components/MoreInfoTabComponents/EthnicitySelector';
import DoYouSmokeSelector from '../../components/MoreInfoTabComponents/DoYouSmokeSelector';
import KidsSelector from '../../components/MoreInfoTabComponents/KidsSelector';
import LookingForSelector from '../../components/MoreInfoTabComponents/LookingForSelector';
import NetWorthSelector from '../../components/MoreInfoTabComponents/NetWorthSelector';

import AppContext from '../../context/CreateGlobalStateContext';
import { Colors, Shadows, useTheme, type ThemeColors } from '../../theme';
import { useProfile } from '../../api/useProfile';
import { useUserImages, mapImagesToSlots } from '../../api/useImages';
import { getAuthSession, completeOnboarding } from '../../utils/session';
import { useAlert } from '../../components/AlertModal';
import { mockStore } from '../../mock/mockStore';
import { t, useTranslation } from '../../i18n';

const MoreDetailsScreen = ({ navigation }: any) => {
  useTranslation();
  const { themeColors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(themeColors, isDark), [themeColors, isDark]);
  const { alert, AlertComponent } = useAlert();

  const {
    name,
    displayName,
    date,
    height,
    selectedAppearance,
    selectedBodyType,
    selectedLanguages,
    englishSkillLevel,
    selectedEthinicity,
    selectedSmoking,
    selectedDrinking,
    selectedLookingFor,
    selectedKids,
    selectedNetWorth,
    profileText,
    images,
    setImages,
    profileImage,
    profileImageUrl,
    selected,
    authUserId,
  } = useContext(AppContext);

  const [loading, setLoading] = useState(false);
  const { updateUser, updateDetails, updatePreferences, useMyProfile } = useProfile();
  const { getAllImages, uploadImage } = useUserImages();
  const profileQuery = useMyProfile(undefined);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.setItem('onboardingStep', 'MoreDetails');

      const onBackPress = () => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.replace('TellUsMore');
        }
        return true;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backHandler.remove();
    }, [navigation]),
  );

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('TellUsMore');
    }
  };

  const resolveGenderOrientation = (sel?: string | null) => {
    switch (sel) {
      case 'straight_woman':
        return { gender: 'woman', orientation: 'straight' };
      case 'straight_man':
        return { gender: 'man', orientation: 'straight' };
      case 'lgbtqia':
        return { gender: 'lgbtqia', orientation: 'lgbtqia' };
      default:
        return { gender: 'woman', orientation: 'straight' };
    }
  };

  const normalizeTextValue = (value: unknown, fallback: string) => {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    return fallback;
  };

  const normalizeJoinedValues = (value: unknown, fallback: string) => {
    if (Array.isArray(value)) {
      const joined = value
        .map((item) => String(item || '').trim())
        .filter(Boolean)
        .join(', ');
      return joined || fallback;
    }
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    return fallback;
  };

  const finishAndGoToHome = async () => {
    try {
      await completeOnboarding();
    } catch {
      // ignore
    }
    navigation.reset({
      index: 0,
      routes: [{ name: 'BottomTabs' }],
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const authSession = await getAuthSession();
      const hasToken = Boolean(authSession?.token);

      // 1. Calculate age & DOB
      const safeDate = date ? new Date(date) : new Date('2000-01-01');
      const today = new Date();
      let calculatedAge = today.getFullYear() - safeDate.getFullYear();
      const monthGap = today.getMonth() - safeDate.getMonth();
      if (
        monthGap < 0 ||
        (monthGap === 0 && today.getDate() < safeDate.getDate())
      ) {
        calculatedAge -= 1;
      }

      const { gender, orientation } = resolveGenderOrientation(selected);

      // 2. Resolve stored bio if context empty
      let storedBio = profileText;
      if (!storedBio) {
        try {
          storedBio = (await AsyncStorage.getItem('@onboarding_bio')) || '';
        } catch {
          // ignore
        }
      }

      // 3. Resolve images
      let availableImages = (Array.isArray(images) ? images : []).filter(
        (img): img is string => typeof img === 'string' && img.trim().length > 0,
      );

      if (availableImages.length === 0) {
        try {
          const stored = await AsyncStorage.getItem('onboardingImages');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              availableImages = parsed.filter(
                (img): img is string =>
                  typeof img === 'string' && img.trim().length > 0,
              );
            }
          }
        } catch {
          // ignore
        }
      }

      const uploadableImages = availableImages.filter(
        (image): image is string =>
          Boolean(image) && !String(image).startsWith('http'),
      );

      const firstImage =
        uploadableImages[0] ||
        availableImages[0] ||
        profileImage ||
        profileImageUrl ||
        null;

      const profilePhoto =
        firstImage && !String(firstImage).startsWith('http')
          ? {
              uri: firstImage,
              type: 'image/jpeg',
              name: 'profile.jpg',
            }
          : undefined;

      const storedName =
        (await AsyncStorage.getItem('name')) ||
        (await AsyncStorage.getItem('displayName')) ||
        (await AsyncStorage.getItem('userName'));
      const effectiveName = normalizeTextValue(
        displayName || name || storedName,
        t('home.usercard.user'),
      );

      const englishLevels = [t('onboarding.moredetailsscreen.basic'), t('profile.userdetails.medium'), 'Good', 'Very Good'];
      const englishLevelStr = englishLevels[englishSkillLevel || 0] || t('onboarding.moredetailsscreen.basic');

      // 4. Build Profile Data
      const profileData = {
        name: effectiveName,
        displayName: effectiveName,
        gender,
        orientation,
        age: calculatedAge,
        bio: normalizeTextValue(
          storedBio,
          'Hello, I am excited to meet new people here.',
        ),
        dob: safeDate.toISOString().split('T')[0],
        language: normalizeJoinedValues(selectedLanguages, t('profile.userdetails.english')),
        appearance: normalizeTextValue(selectedAppearance, t('profile.userdetails.attractive')),
        bodyType: normalizeTextValue(selectedBodyType, t('profile.userdetails.slim')),
        height: Number(height) || 165,
        englishLevel: englishLevelStr,
        ethnicity: normalizeTextValue(selectedEthinicity, t('profile.userdetails.other')),
        lookingFor: normalizeJoinedValues(selectedLookingFor, t('profile.userdetails.relationship')),
        smoke: normalizeTextValue(selectedSmoking, t('profile.userdetails.no')),
        drink: normalizeTextValue(selectedDrinking, t('profile.userdetails.no')),
        photos: availableImages,
      };

      // 5. Build Details and Prefs Payloads
      const detailsPayload = {
        language: normalizeJoinedValues(selectedLanguages, t('profile.userdetails.english')),
        appearance: selectedAppearance || '',
        bodyType: selectedBodyType || '',
        height: Number(height) || 165,
        englishLevel: englishLevelStr,
        ethnicity: selectedEthinicity || '',
        kidCount: selectedKids || '',
        netWorth: selectedNetWorth || '',
      };

      const prefsPayload = {
        lookingFor: normalizeJoinedValues(selectedLookingFor, t('profile.userdetails.relationship')),
        smoke: selectedSmoking || '',
        drink: selectedDrinking || '',
        ethnicity: selectedEthinicity || '',
      };

      // 6. Save persistent locals and mockStore
      if (selectedKids) {
        await AsyncStorage.setItem('@amara_kid_count', selectedKids);
      } else {
        await AsyncStorage.removeItem('@amara_kid_count');
      }
      if (selectedNetWorth) {
        await AsyncStorage.setItem('@amara_net_worth', selectedNetWorth);
      } else {
        await AsyncStorage.removeItem('@amara_net_worth');
      }

      try {
        const uid =
          authSession?.userId ||
          (await AsyncStorage.getItem('userId')) ||
          (await mockStore.getCurrentUserId());
        if (uid) {
          await mockStore.saveProfile({
            userId: uid,
            ...profileData,
            ...detailsPayload,
            ...prefsPayload,
            photos: availableImages,
          });
        }
      } catch (err) {
        console.warn('[MoreDetails] mockStore profile save error:', err);
      }

      // 7. Submit to backend if token available
      if (hasToken) {
        try {
          // Upload any local gallery images first so backend gallery count >= 3
          if (uploadableImages.length > 0) {
            await Promise.allSettled(
              uploadableImages.map((uri, i) =>
                uploadImage.mutateAsync({
                  photo: { uri, name: `gallery_${i + 1}.jpg`, type: 'image/jpeg' },
                }),
              ),
            );
          }

          await updateUser.mutateAsync({
            uid: '',
            dto: profileData,
            photo: profilePhoto,
          });

          await updateDetails.mutateAsync(detailsPayload);
          await updatePreferences.mutateAsync(prefsPayload);
        } catch (err) {
          console.warn('[MoreDetails] Background sync warning:', err);
        }
      }

      await finishAndGoToHome();
    } catch (error: any) {
      console.warn('[MoreDetails] Save error:', error);
      // Fallback: allow finishing even if server is unreachable
      await finishAndGoToHome();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={themeColors.background}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Top Header: Back button & 8-step progress bar (Step 8 active) */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={28} color={isDark ? '#FFFFFF' : '#000000'} />
          </TouchableOpacity>
          <View style={styles.progressBarWrapper}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((stepNum) => (
              <View
                key={stepNum}
                style={[
                  styles.progressDash,
                  stepNum <= 8
                    ? { backgroundColor: themeColors.primary }
                    : { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E5E7EB' },
                ]}
              />
            ))}
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Headline matching Image 4 */}
          <Text style={styles.heading}>{t('onboarding.moredetailsscreen.tell_us_more_about_yourself')}</Text>

          {/* Second half of About me components */}
          <EthnicitySelector />
          <DoYouSmokeSelector />
          <KidsSelector />
          <LookingForSelector />
          <NetWorthSelector />

          {/* Save / Done Button */}
          <View style={styles.bottomSection}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[themeColors.primary, themeColors.secondary || themeColors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.saveGradient}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>{t('more_info.savebutton.save')}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
      {AlertComponent}
    </View>
  );
};

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
      paddingVertical: 12,
    },
    backBtn: {
      paddingRight: 12,
      paddingVertical: 4,
    },
    progressBarWrapper: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    progressDash: {
      flex: 1,
      height: 4,
      borderRadius: 2,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 32,
    },
    heading: {
      fontSize: 24,
      fontWeight: '800',
      color: isDark ? '#FFFFFF' : '#0F172A',
      paddingHorizontal: 20,
      marginTop: 12,
      marginBottom: 10,
      letterSpacing: -0.3,
    },
    bottomSection: {
      paddingHorizontal: 20,
      marginTop: 28,
      alignItems: 'center',
    },
    saveButton: {
      width: '100%',
      borderRadius: 28,
      overflow: 'hidden',
      marginBottom: Platform.OS === 'ios' ? 8 : 16,
      ...Shadows.md,
    },
    saveGradient: {
      height: 54,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveButtonText: {
      color: Colors.white,
      fontSize: 17,
      fontWeight: '700',
    },
  });

export default MoreDetailsScreen;
