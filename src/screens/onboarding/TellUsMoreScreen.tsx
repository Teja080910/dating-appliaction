import React, { useCallback, useMemo } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';

import HeightSelector from '../../components/MoreInfoTabComponents/HeightSelector';
import BodyTypeSelector from '../../components/MoreInfoTabComponents/BodyTypeSelector';
import AppearanceSelector from '../../components/MoreInfoTabComponents/AppearanceSelector';
import LanguagesSelector from '../../components/MoreInfoTabComponents/LanguagesSelector';
import EnglishSkillSelector from '../../components/MoreInfoTabComponents/EnglishSkillSelector';

import { Colors, Shadows, useTheme, type ThemeColors } from '../../theme';
import { t, useTranslation } from '../../i18n';

const TellUsMoreScreen = ({ navigation }: any) => {
  useTranslation();
  const { themeColors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(themeColors, isDark), [themeColors, isDark]);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.setItem('onboardingStep', 'TellUsMore');

      const onBackPress = () => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.replace('AboutProfile');
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
      navigation.replace('AboutProfile');
    }
  };

  const handleNext = async () => {
    navigation.navigate('MoreDetails');
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={themeColors.background}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Top Header: Back button & 8-step progress bar (Step 7 active) */}
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
                  stepNum <= 7
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
          {/* Headline matching user screenshots */}
          <Text style={styles.heading}>{t('onboarding.moredetailsscreen.tell_us_more_about_yourself')}</Text>

          {/* First half of About me components */}
          <HeightSelector />
          <BodyTypeSelector />
          <AppearanceSelector />
          <LanguagesSelector />
          <EnglishSkillSelector />

          {/* Bottom Section: "Almost there!" + Next button */}
          <View style={styles.bottomSection}>
            <Text style={styles.almostThereText}>{t('onboarding.tellusmorescreen.almost_there')}</Text>

            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[themeColors.primary, themeColors.secondary || themeColors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.nextGradient}
              >
                <Text style={styles.nextButtonText}>{t('onboarding.aboutprofilescreen.next')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
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
    almostThereText: {
      fontSize: 18,
      fontWeight: '700',
      color: isDark ? '#FFFFFF' : '#0F172A',
      marginBottom: 16,
    },
    nextButton: {
      width: '100%',
      borderRadius: 28,
      overflow: 'hidden',
      marginBottom: Platform.OS === 'ios' ? 8 : 16,
      ...Shadows.md,
    },
    nextGradient: {
      height: 54,
      alignItems: 'center',
      justifyContent: 'center',
    },
    nextButtonText: {
      color: Colors.white,
      fontSize: 17,
      fontWeight: '700',
    },
  });

export default TellUsMoreScreen;
