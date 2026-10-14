import React, {
  useContext,
  useCallback,
  useMemo,
} from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AppContext from '../../context/CreateGlobalStateContext';
import { Colors, Spacing, Shadows, useTheme, type ThemeColors } from '../../theme';
import { t, useTranslation } from '../../i18n';

const AboutProfileScreen = ({ navigation }: any) => {
  useTranslation();
  const { themeColors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(themeColors, isDark), [themeColors, isDark]);

  const {
    profileText,
    setProfileText,
  } = useContext(AppContext);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.setItem('onboardingStep', 'AboutProfile');

      const onBackPress = () => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.replace('ConnectTelegram');
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
      navigation.replace('ConnectTelegram');
    }
  };

  const handleNext = async () => {
    const trimmed = (profileText || '').trim();
    if (!trimmed) {
      return;
    }

    try {
      await AsyncStorage.setItem('@onboarding_bio', trimmed);
    } catch {
      // ignore
    }

    navigation.navigate('TellUsMore');
  };

  const isNextDisabled = !profileText?.trim();

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={themeColors.background}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Top Header: Back button & 8-step progress bar (Step 6 active) */}
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
                  stepNum <= 6
                    ? { backgroundColor: themeColors.primary }
                    : { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E5E7EB' },
                ]}
              />
            ))}
          </View>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Title & Subtitle matching Image 1 */}
            <Text style={styles.heading}>{t('onboarding.aboutprofilescreen.about_you')}</Text>
            <Text style={styles.subtext}>{t('onboarding.aboutprofilescreen.who_are_you_and_what_makes_you_great_company')}</Text>

            {/* Input Card */}
            <View style={styles.inputCard}>
              <TextInput
                style={styles.input}
                placeholder={t('profile.description.tell_us_about_yourself')}
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                value={profileText}
                onChangeText={setProfileText}
                maxLength={150}
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* Character Counter (e.g. 0 / 150) */}
            <Text style={styles.charCount}>
              {profileText?.length || 0} / 150
            </Text>

            <View style={{ flex: 1 }} />

            {/* Next Button */}
            <TouchableOpacity
              style={[
                styles.nextButton,
                isNextDisabled && { opacity: 0.5 },
              ]}
              disabled={isNextDisabled}
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
          </ScrollView>
        </KeyboardAvoidingView>
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
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 24,
    },
    heading: {
      fontSize: 26,
      fontWeight: '800',
      color: isDark ? '#FFFFFF' : '#0F172A',
      marginBottom: 8,
      letterSpacing: -0.3,
    },
    subtext: {
      fontSize: 15,
      lineHeight: 22,
      color: isDark ? '#94A3B8' : '#64748B',
      marginBottom: 24,
    },
    inputCard: {
      backgroundColor: isDark ? '#1A1730' : '#F8FAFC',
      borderRadius: 18,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
      padding: 16,
      minHeight: 180,
    },
    input: {
      fontSize: 16,
      lineHeight: 22,
      color: isDark ? '#FFFFFF' : '#0F172A',
      minHeight: 150,
      padding: 0,
    },
    charCount: {
      textAlign: 'right',
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#94A3B8' : '#64748B',
      marginTop: 10,
      marginBottom: 24,
    },
    nextButton: {
      borderRadius: 28,
      overflow: 'hidden',
      marginTop: 'auto',
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

export default AboutProfileScreen;
