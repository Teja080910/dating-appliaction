import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  BackHandler,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppContext from '../../context/CreateGlobalStateContext';
import { saveGender } from '../../utils/types/AsyncStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../theme';
import { useProfile } from '../../api/useProfile';
import { getUserId } from '../../utils/sessionHelper';
import { useAlert } from '../../components/AlertModal';
import { t, useTranslation } from '../../i18n';

const GenderOrientationScreen = ({ navigation }: any) => {
  useTranslation();
  const { setSelected } = useContext(AppContext);
  const [selection, setSelection] = useState<string>('straight_man');
  const { genderOrientation } = useProfile();
  const { alert, AlertComponent } = useAlert();
  const { isDark } = useTheme();

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.setItem('onboardingStep', 'GenderOrientation');
      const onBackPress = () => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.replace('Login');
        }
        return true;
      };
      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backHandler.remove();
    }, [navigation]),
  );

  const handleNext = async () => {
    if (selection) {
      try {
        setSelected(selection);
        await saveGender(selection);
        const resolvedUserId = await getUserId();

        const genderPayload =
          selection === 'straight_woman'
            ? { userId: resolvedUserId, gender: 'woman', orientation: 'straight' }
            : selection === 'straight_man'
              ? { userId: resolvedUserId, gender: 'man', orientation: 'straight' }
              : { userId: resolvedUserId, gender: 'lgbtqia', orientation: 'lgbtqia' };

        await genderOrientation.mutateAsync(genderPayload);
        await AsyncStorage.setItem('GenderOrientation', 'true');
        navigation.navigate('DisplayName');
      } catch (error) {
        // Still navigate for seamless onboarding
        navigation.navigate('DisplayName');
      }
    } else {
      alert('Selection Required', 'Please select your gender and orientation to continue.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0F0D1A' : '#FFFFFF' }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#0F0D1A' : '#FFFFFF'}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header: Back Button & Segmented Progress Bar */}
        <View style={styles.topHeaderRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              if (navigation.canGoBack()) navigation.goBack();
              else navigation.replace('Login');
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Icon name="chevron-left" size={32} color={isDark ? '#FFFFFF' : '#111827'} />
          </TouchableOpacity>

          {/* 8-Segment Progress Bar */}
          <View style={styles.progressBarWrapper}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((stepNum) => (
              <View
                key={stepNum}
                style={[
                  styles.progressDash,
                  stepNum === 1
                    ? styles.progressDashActive
                    : { backgroundColor: isDark ? '#2D2950' : '#E5E7EB' },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Heading & Subtitle */}
        <View style={styles.titleContainer}>
          <Text style={[styles.mainTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>{t('onboarding.genderorientationscreen.hey_there')}</Text>
          <Text style={[styles.subTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>{t('onboarding.genderorientationscreen.whats_your_gender')}</Text>
        </View>

        {/* 3 Selectable Options */}
        <View style={styles.optionsList}>
          {/* Option 1: Man */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.optionCard,
              { backgroundColor: isDark ? '#1A1730' : '#F3F4F6' },
              selection === 'straight_man' && styles.manCardActive,
            ]}
            onPress={() => setSelection('straight_man')}
          >
            <View style={styles.optionLeftText}>
              <View style={styles.optionTitleRow}>
                <Text style={[styles.optionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>{t('onboarding.genderorientationscreen.i_am_a')}<Text style={styles.boldText}>{t('onboarding.genderorientationscreen.man')}</Text>
                </Text>
                {selection === 'straight_man' && (
                  <Icon name="check" size={20} color="#3B82F6" style={styles.checkMark} />
                )}
              </View>
              <Text style={[styles.optionSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{t('onboarding.genderorientationscreen.and_like_women')}</Text>
            </View>
            <Icon name="account" size={46} color={isDark ? '#9CA3AF' : '#4B5563'} />
          </TouchableOpacity>

          {/* Option 2: Woman */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.optionCard,
              { backgroundColor: isDark ? '#1A1730' : '#F3F4F6' },
              selection === 'straight_woman' && styles.womanCardActive,
            ]}
            onPress={() => setSelection('straight_woman')}
          >
            <View style={styles.optionLeftText}>
              <View style={styles.optionTitleRow}>
                <Text style={[styles.optionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>{t('onboarding.genderorientationscreen.i_am_a')}<Text style={styles.boldText}>{t('onboarding.genderorientationscreen.woman')}</Text>
                </Text>
                {selection === 'straight_woman' && (
                  <Icon name="check" size={20} color="#EC4899" style={styles.checkMark} />
                )}
              </View>
              <Text style={[styles.optionSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{t('onboarding.genderorientationscreen.and_like_men')}</Text>
            </View>
            <Icon name="face-woman-profile" size={46} color={isDark ? '#9CA3AF' : '#4B5563'} />
          </TouchableOpacity>

          {/* Option 3: LGBTQ+ */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.optionCard,
              { backgroundColor: isDark ? '#1A1730' : '#F3F4F6' },
              selection === 'lgbtqia' && styles.lgbtqCardActive,
            ]}
            onPress={() => setSelection('lgbtqia')}
          >
            {/* Left Rainbow Accent Stripe */}
            <View style={styles.rainbowStripe} />
            <View style={styles.optionLeftText}>
              <View style={styles.optionTitleRow}>
                <Text style={[styles.optionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>{t('onboarding.genderorientationscreen.i_am')}<Text style={styles.boldText}>{t('onboarding.genderorientationscreen.lgbtq')}</Text>
                </Text>
                {selection === 'lgbtqia' && (
                  <Icon name="check" size={20} color="#7C3AED" style={styles.checkMark} />
                )}
              </View>
              <Text style={[styles.optionSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>{t('onboarding.genderorientationscreen.lesbian_gay_bisexual_trans_queer')}</Text>
            </View>
            <Icon name="account-group" size={46} color={isDark ? '#9CA3AF' : '#4B5563'} />
          </TouchableOpacity>
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Privacy Info Callout */}
        <View style={[styles.infoCallout, { backgroundColor: isDark ? '#1E293B' : '#EFF6FF' }]}>
          <Icon name="information" size={24} color="#3B82F6" style={styles.infoIcon} />
          <Text style={[styles.infoText, { color: isDark ? '#93C5FD' : '#1D4ED8' }]}>{t('onboarding.genderorientationscreen.your_gender_information_is_private_and_used_only_for_matching')}</Text>
        </View>

        {/* Bottom Next Button */}
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>{t('onboarding.aboutprofilescreen.next')}</Text>
        </TouchableOpacity>
      </ScrollView>
      {AlertComponent}
    </SafeAreaView>
  );
};

export default GenderOrientationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'android' ? 12 : 6,
    paddingBottom: 24,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backBtn: {
    marginRight: 12,
    marginLeft: -6,
  },
  progressBarWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
    gap: 6,
  },
  progressDash: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressDashActive: {
    backgroundColor: '#7C3AED',
  },
  titleContainer: {
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  optionsList: {
    gap: 14,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  manCardActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  womanCardActive: {
    borderColor: '#EC4899',
    backgroundColor: '#FFFFFF',
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  lgbtqCardActive: {
    borderColor: '#7C3AED',
    backgroundColor: '#FFFFFF',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  rainbowStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: '#7C3AED',
  },
  optionLeftText: {
    flex: 1,
    paddingRight: 12,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '500',
  },
  boldText: {
    fontWeight: '800',
  },
  checkMark: {
    marginLeft: 6,
  },
  optionSubtitle: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 18,
  },
  spacer: {
    flex: 1,
    minHeight: 30,
  },
  infoCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  infoIcon: {
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '500',
    lineHeight: 19,
  },
  nextBtn: {
    backgroundColor: '#7C3AED',
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  nextBtnText: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
