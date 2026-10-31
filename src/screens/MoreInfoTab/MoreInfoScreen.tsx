import React, { useCallback, useContext, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProfile } from '../../api/useProfile';
import AppearanceSelector from '../../components/MoreInfoTabComponents/AppearanceSelector';
import BodyTypeSelector from '../../components/MoreInfoTabComponents/BodyTypeSelector';
import DoYouSmokeSelector from '../../components/MoreInfoTabComponents/DoYouSmokeSelector';
import EnglishSkillSelector from '../../components/MoreInfoTabComponents/EnglishSkillSelector';
import EthnicitySelector from '../../components/MoreInfoTabComponents/EthnicitySelector';
import Header from '../../components/MoreInfoTabComponents/Header';
import HeightSelector from '../../components/MoreInfoTabComponents/HeightSelector';
import KidsSelector from '../../components/MoreInfoTabComponents/KidsSelector';
import LanguagesSelector from '../../components/MoreInfoTabComponents/LanguagesSelector';
import LookingForSelector from '../../components/MoreInfoTabComponents/LookingForSelector';
import NetWorthSelector from '../../components/MoreInfoTabComponents/NetWorthSelector';
import SaveButton from '../../components/MoreInfoTabComponents/SaveButton';
import AppContext from '../../context/CreateGlobalStateContext';
import { getAuthSession } from '../../utils/session';
import { Colors, useTheme } from '../../theme';
import { useAlert } from '../../components/AlertModal';
import { getUserFriendlyMessage } from '../../utils/userFriendlyMessages';
import { t, useTranslation } from '../../i18n';

const HIDDEN_PROFILE_LANGUAGES = new Set(['telugu']);
const HIDDEN_LOOKING_FOR_VALUES = new Set(['long-term relationship']);

const MoreInfoScreen = () => {
  useTranslation();
  const { themeColors } = useTheme();
  const { alert, AlertComponent } = useAlert();
  const insets = useSafeAreaInsets();

  const {
    height,
    setHeight,
    selectedAppearance,
    setSelectedAppearance,
    selectedBodyType,
    setSelectedBodyType,
    selectedLanguages,
    setSelectedLanguages,
    englishSkillLevel,
    setEnglishSkillLevel,
    selectedEthinicity,
    setSelectedEthinicity,
    selectedSmoking,
    setSelectedSmoking,
    selectedDrinking,
    selectedLookingFor,
    setSelectedLookingFor,
    selectedKids,
    setSelectedKids,
    selectedNetWorth,
    setSelectedNetWorth,
  } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const { updateDetails, updatePreferences, useMyProfile } = useProfile();
  const profileQuery = useMyProfile(undefined);

  useFocusEffect(
    useCallback(() => {
      profileQuery.refetch();
    }, [])
  );

  useEffect(() => {
    // Check local storage for all lifestyle keys in case backend sync is pending
    AsyncStorage.multiGet([
      '@amara_kid_count',
      '@amara_net_worth',
      '@amara_height',
      '@amara_appearance',
      '@amara_body_type',
      '@amara_ethnicity',
      '@amara_smoking',
      '@amara_looking_for',
      '@amara_languages',
      '@amara_english_level',
    ]).then((pairs) => {
      pairs.forEach(([key, val]) => {
        if (!val) return;
        if (key === '@amara_kid_count') setSelectedKids((prev: any) => prev || val);
        if (key === '@amara_net_worth') setSelectedNetWorth((prev: any) => prev || val);
        if (key === '@amara_height') setHeight((prev: any) => prev || Number(val));
        if (key === '@amara_appearance') setSelectedAppearance((prev: any) => prev || val);
        if (key === '@amara_body_type') setSelectedBodyType((prev: any) => prev || val);
        if (key === '@amara_ethnicity') setSelectedEthinicity((prev: any) => prev || val);
        if (key === '@amara_smoking') setSelectedSmoking((prev: any) => prev || val);
        if (key === '@amara_english_level') setEnglishSkillLevel((prev: any) => (prev !== undefined && prev !== null ? prev : Number(val)));
        if (key === '@amara_looking_for') {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setSelectedLookingFor((prev: any) => (Array.isArray(prev) && prev.length > 0 ? prev : parsed));
            }
          } catch {}
        }
        if (key === '@amara_languages') {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setSelectedLanguages((prev: any) => (Array.isArray(prev) && prev.length > 0 ? prev : parsed));
            }
          } catch {}
        }
      });
    });
  }, [setEnglishSkillLevel, setHeight, setSelectedAppearance, setSelectedBodyType, setSelectedEthinicity, setSelectedKids, setSelectedLanguages, setSelectedLookingFor, setSelectedNetWorth, setSelectedSmoking]);

  useEffect(() => {
    const profile = profileQuery.data;
    if (!profile) {
      return;
    }

    console.log('[MoreInfo] Profile loaded from API:', JSON.stringify({
      ethnicity: profile.ethnicity,
      lookingFor: profile.lookingFor,
      smoke: profile.smoke,
      kidCount: profile.kidCount,
      netWorth: profile.netWorth,
    }));

    const splitValues = (value?: string) =>
      String(value || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

    const visibleLanguages = splitValues(profile.language).filter(
      (item) => !HIDDEN_PROFILE_LANGUAGES.has(item.toLowerCase()),
    );
    const visibleLookingFor = splitValues(profile.lookingFor).filter(
      (item) => !HIDDEN_LOOKING_FOR_VALUES.has(item.toLowerCase()),
    );

    const englishLevelMap = ['basic', 'medium', 'good', 'very good'];
    const legacyEnglishMap = ['beginner', 'intermediate', 'advanced', 'native'];
    const levelStr = String(profile.englishLevel || '').toLowerCase();
    let englishIndex = englishLevelMap.indexOf(levelStr);
    if (englishIndex === -1) {
      englishIndex = legacyEnglishMap.indexOf(levelStr);
    }

    if (profile.height) {
      setHeight(Number(profile.height));
    }
    if (profile.appearance) {
      setSelectedAppearance(profile.appearance);
    }
    if (profile.bodyType) {
      setSelectedBodyType(profile.bodyType);
    }
    if (visibleLanguages.length > 0) {
      setSelectedLanguages(visibleLanguages);
    }
    if (profile.ethnicity) {
      setSelectedEthinicity(profile.ethnicity);
    }
    if (profile.smoke) {
      setSelectedSmoking(profile.smoke);
    }
    if (visibleLookingFor.length > 0) {
      setSelectedLookingFor(visibleLookingFor);
    }
    if (profile.kidCount || profile.kids) {
      setSelectedKids(profile.kidCount || profile.kids);
    }
    if (profile.netWorth) {
      setSelectedNetWorth(profile.netWorth);
    }
    if (englishIndex >= 0) {
      setEnglishSkillLevel(englishIndex);
    }
  }, [profileQuery.data, setEnglishSkillLevel, setHeight, setSelectedAppearance, setSelectedBodyType, setSelectedEthinicity, setSelectedKids, setSelectedLanguages, setSelectedLookingFor, setSelectedNetWorth, setSelectedSmoking]);

  const handleSave = async () => {
    const authSession = await getAuthSession();
    const hasUsableSessionToken = Boolean(authSession?.token);

    if (!hasUsableSessionToken) {
      alert(t('more_info.moreinfoscreen.session_error'), t('more_info.moreinfoscreen.please_log_in_again_to_continue'));
      return;
    }

    try {
      setLoading(true);

      const englishLevels = [t('onboarding.moredetailsscreen.basic'), t('profile.userdetails.medium'), 'Good', 'Very Good'];
      const englishLevelStr = englishLevels[englishSkillLevel] || '';
      const languageStr = Array.isArray(selectedLanguages) ? selectedLanguages.join(', ') : '';
      const lookingForStr = Array.isArray(selectedLookingFor) ? selectedLookingFor.join(', ') : '';

      const detailsPayload = {
        language: languageStr,
        appearance: selectedAppearance || '',
        bodyType: selectedBodyType || '',
        height: Number(height) || 0,
        englishLevel: englishLevelStr,
        ethnicity: selectedEthinicity || '',
        kidCount: selectedKids || '',
        netWorth: selectedNetWorth || '',
      };

      const prefsPayload = {
        lookingFor: lookingForStr,
        smoke: selectedSmoking || '',
        drink: selectedDrinking || '',
        ethnicity: selectedEthinicity || '',
      };

      await AsyncStorage.multiSet([
        ['@amara_height', String(height || '')],
        ['@amara_appearance', selectedAppearance || ''],
        ['@amara_body_type', selectedBodyType || ''],
        ['@amara_ethnicity', selectedEthinicity || ''],
        ['@amara_smoking', selectedSmoking || ''],
        ['@amara_drinking', selectedDrinking || ''],
        ['@amara_looking_for', JSON.stringify(selectedLookingFor || [])],
        ['@amara_languages', JSON.stringify(selectedLanguages || [])],
        ['@amara_english_level', String(englishSkillLevel ?? 0)],
        ['@amara_kid_count', selectedKids || ''],
        ['@amara_net_worth', selectedNetWorth || ''],
      ]);

      await updateDetails.mutateAsync(detailsPayload);
      await updatePreferences.mutateAsync(prefsPayload);

      await profileQuery.refetch();
      alert(t('search.location.saved'), t('more_info.moreinfoscreen.your_profile_details_have_been_updated'), [
        { text: t('more_info.moreinfoscreen.close'), style: 'default' },
      ]);
    } catch (error: any) {
      console.log('[MoreInfo] SAVE FAILED:', error?.message, error?.response?.data);
      alert(
        t('more_info.moreinfoscreen.save_failed'),
        getUserFriendlyMessage(error, t('more_info.moreinfoscreen.we_could_not_save_your_profile_details_right_now')),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <Header />
      <ScrollView
        style={[styles.scrollView, { backgroundColor: themeColors.background }]}
        contentContainerStyle={[
          styles.scrollContent,
          { backgroundColor: themeColors.background },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.content, { backgroundColor: themeColors.background }]}>
          <HeightSelector />
          <BodyTypeSelector />
          <AppearanceSelector />
          <LanguagesSelector />
          <EnglishSkillSelector />
          <EthnicitySelector />
          <DoYouSmokeSelector />
          <KidsSelector />
          <LookingForSelector />
          <NetWorthSelector />
        </View>
      </ScrollView>
      <View
        style={[
          styles.footer,
          {
            backgroundColor: themeColors.background,
            borderTopColor: themeColors.divider,
            paddingBottom: insets.bottom > 0 ? insets.bottom + 6 : 14,
          },
        ]}
      >
        <SaveButton onPress={handleSave} loading={loading} />
      </View>
      {AlertComponent}
    </SafeAreaView>
  );
};

export default MoreInfoScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  content: {
    flex: 1,
    paddingBottom: 10,
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
});


