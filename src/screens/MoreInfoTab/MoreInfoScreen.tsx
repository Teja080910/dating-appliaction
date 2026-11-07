import React, { useCallback, useContext, useEffect, useState } from 'react';
import { DeviceEventEmitter, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProfile, useMyProfile } from '../../api/useProfile';
import AppearanceSelector from '../../components/MoreInfoTabComponents/AppearanceSelector';
import BodyTypeSelector from '../../components/MoreInfoTabComponents/BodyTypeSelector';
import DoYouSmokeSelector from '../../components/MoreInfoTabComponents/DoYouSmokeSelector';
import DrinkingSelector from '../../components/MoreInfoTabComponents/DrinkingSelector';
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
  const route = useRoute();

  const isInsideBottomTab = route.name === 'AboutMe' || Boolean((route as any).name?.toLowerCase().includes('about'));
  const bottomMargin = isInsideBottomTab
    ? (Platform.OS === 'ios' ? 70 : 66) + Math.max(insets.bottom, 0)
    : Math.max(insets.bottom, 14);

  const {
    height,
    setHeight,
    tempHeight,
    setTempHeight,
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
    setSelectedDrinking,
    selectedLookingFor,
    setSelectedLookingFor,
    selectedKids,
    setSelectedKids,
    selectedNetWorth,
    setSelectedNetWorth,
  } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const { updateDetails, updatePreferences } = useProfile();
  const profileQuery = useMyProfile(undefined);

  const hydrateFromStorage = useCallback(async () => {
    try {
      const pairs = await AsyncStorage.multiGet([
        '@amara_kid_count',
        '@amara_net_worth',
        '@amara_height',
        '@amara_appearance',
        '@amara_body_type',
        '@amara_ethnicity',
        '@amara_smoking',
        '@amara_drinking',
        '@amara_looking_for',
        '@amara_languages',
        '@amara_english_level',
      ]);
      pairs.forEach(([key, val]) => {
        if (!val || val === 'null' || val === 'undefined') return;
        if (key === '@amara_kid_count') {
          setSelectedKids(String(val).replace(/^kids:\s*/i, '').trim());
        }
        if (key === '@amara_net_worth') {
          setSelectedNetWorth(String(val).replace(/^\$\s*/, '').trim());
        }
        if (key === '@amara_height') {
          const num = Number(val);
          if (Number.isFinite(num) && num > 0) {
            setHeight(num);
            setTempHeight?.(num);
          }
        }
        if (key === '@amara_appearance') setSelectedAppearance(val);
        if (key === '@amara_body_type') setSelectedBodyType(val);
        if (key === '@amara_ethnicity') setSelectedEthinicity(val);
        if (key === '@amara_smoking') setSelectedSmoking(val);
        if (key === '@amara_drinking') setSelectedDrinking(val);
        if (key === '@amara_english_level') {
          const lvl = Number(val);
          if (Number.isFinite(lvl) && lvl >= 0 && lvl <= 3) {
            setEnglishSkillLevel(lvl);
          }
        }
        if (key === '@amara_looking_for') {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setSelectedLookingFor(parsed);
            }
          } catch {
            const split = val.split(',').map((s) => s.trim()).filter(Boolean);
            if (split.length > 0) setSelectedLookingFor(split);
          }
        }
        if (key === '@amara_languages') {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setSelectedLanguages(parsed);
            }
          } catch {
            const split = val.split(',').map((s) => s.trim()).filter(Boolean);
            if (split.length > 0) setSelectedLanguages(split);
          }
        }
      });
    } catch (e) {
      console.warn('[MoreInfo] Failed to hydrate from AsyncStorage:', e);
    }
  }, [
    setEnglishSkillLevel,
    setHeight,
    setTempHeight,
    setSelectedAppearance,
    setSelectedBodyType,
    setSelectedDrinking,
    setSelectedEthinicity,
    setSelectedKids,
    setSelectedLanguages,
    setSelectedLookingFor,
    setSelectedNetWorth,
    setSelectedSmoking,
  ]);

  useFocusEffect(
    useCallback(() => {
      void hydrateFromStorage();
      void profileQuery.refetch();
    }, [hydrateFromStorage, profileQuery])
  );

  useEffect(() => {
    void hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    const profile = profileQuery.data;
    if (!profile) {
      return;
    }

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
    const rawLevelStr = String(profile.englishLevel || '').trim().toLowerCase();
    let englishIndex = englishLevelMap.indexOf(rawLevelStr);
    if (englishIndex === -1) {
      englishIndex = legacyEnglishMap.indexOf(rawLevelStr);
    }
    const numLevel = Number(profile.englishLevel);
    if (
      englishIndex === -1 &&
      Number.isFinite(numLevel) &&
      numLevel >= 0 &&
      numLevel <= 3 &&
      String(profile.englishLevel).trim() !== ''
    ) {
      englishIndex = numLevel;
    }

    if (profile.height) {
      const h = Number(profile.height);
      if (Number.isFinite(h) && h > 0) {
        setHeight(h);
        setTempHeight?.(h);
      }
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
    if (profile.drink) {
      setSelectedDrinking(profile.drink);
    }
    if (visibleLookingFor.length > 0) {
      setSelectedLookingFor(visibleLookingFor);
    }
    const rawKids =
      profile.kidCount !== undefined &&
      profile.kidCount !== null &&
      String(profile.kidCount).trim() !== ''
        ? profile.kidCount
        : profile.kids !== undefined &&
          profile.kids !== null &&
          String(profile.kids).trim() !== ''
        ? profile.kids
        : null;
    if (rawKids !== null) {
      setSelectedKids(String(rawKids).replace(/^kids:\s*/i, '').trim());
    }
    if (profile.netWorth) {
      setSelectedNetWorth(String(profile.netWorth).replace(/^\$\s*/, '').trim());
    }
    if (englishIndex >= 0) {
      setEnglishSkillLevel(englishIndex);
    }

    // Persist to AsyncStorage for offline and immediate next load
    AsyncStorage.multiSet([
      ['@amara_height', String(profile.height || '')],
      ['@amara_appearance', profile.appearance || ''],
      ['@amara_body_type', profile.bodyType || ''],
      ['@amara_ethnicity', profile.ethnicity || ''],
      ['@amara_smoking', profile.smoke || ''],
      ['@amara_drinking', profile.drink || ''],
      ['@amara_looking_for', JSON.stringify(visibleLookingFor || [])],
      ['@amara_languages', JSON.stringify(visibleLanguages || [])],
      ['@amara_english_level', String(englishIndex >= 0 ? englishIndex : '')],
      ['@amara_kid_count', rawKids !== null ? String(rawKids).replace(/^kids:\s*/i, '').trim() : ''],
      ['@amara_net_worth', profile.netWorth ? String(profile.netWorth).replace(/^\$\s*/, '').trim() : ''],
    ]).catch(() => {});
  }, [
    profileQuery.data,
    setEnglishSkillLevel,
    setHeight,
    setTempHeight,
    setSelectedAppearance,
    setSelectedBodyType,
    setSelectedDrinking,
    setSelectedEthinicity,
    setSelectedKids,
    setSelectedLanguages,
    setSelectedLookingFor,
    setSelectedNetWorth,
    setSelectedSmoking,
  ]);

  const handleSave = async () => {
    const authSession = await getAuthSession();
    const hasUsableSessionToken = Boolean(authSession?.token);

    if (!hasUsableSessionToken) {
      alert(t('more_info.moreinfoscreen.session_error'), t('more_info.moreinfoscreen.please_log_in_again_to_continue'));
      return;
    }

    try {
      setLoading(true);

      const englishLevels = ['Basic', 'Medium', 'Good', 'Very Good'];
      const englishLevelStr = englishLevels[Number(englishSkillLevel)] || 'Basic';
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

      await Promise.allSettled([
        updateDetails.mutateAsync(detailsPayload),
        updatePreferences.mutateAsync(prefsPayload),
      ]);

      DeviceEventEmitter.emit('AMARA_PROFILE_UPDATED');
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
          <DrinkingSelector />
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
            marginBottom: bottomMargin,
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
    paddingBottom: 24,
  },
  content: {
    flex: 1,
    paddingBottom: 10,
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 8,
    zIndex: 10,
  },
});


