import React, { useContext, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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

const HIDDEN_PROFILE_LANGUAGES = new Set(['telugu']);
const HIDDEN_LOOKING_FOR_VALUES = new Set(['long-term relationship']);

const MoreInfoScreen = () => {
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

  useEffect(() => {
    // Check local storage for kids & net worth in case backend doesn't store them yet
    AsyncStorage.getItem('@amara_kid_count').then((val) => {
      if (val) setSelectedKids(val);
    });
    AsyncStorage.getItem('@amara_net_worth').then((val) => {
      if (val) setSelectedNetWorth(val);
    });
  }, [setSelectedKids, setSelectedNetWorth]);

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
    setSelectedAppearance(profile.appearance || null);
    setSelectedBodyType(profile.bodyType || null);
    setSelectedLanguages(visibleLanguages);
    setSelectedEthinicity(profile.ethnicity || null);
    setSelectedSmoking(profile.smoke || null);
    setSelectedLookingFor(visibleLookingFor);
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
      alert('Session error', 'Please log in again to continue.');
      return;
    }

    try {
      setLoading(true);

      const englishLevels = ['Basic', 'Medium', 'Good', 'Very Good'];
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

      if (selectedKids) {
        await AsyncStorage.setItem('@amara_kid_count', selectedKids);
      }
      if (selectedNetWorth) {
        await AsyncStorage.setItem('@amara_net_worth', selectedNetWorth);
      }

      await updateDetails.mutateAsync(detailsPayload);
      await updatePreferences.mutateAsync(prefsPayload);

      await profileQuery.refetch();
      alert('Saved', 'Your profile details have been updated.', [
        { text: 'Close', style: 'default' },
      ]);
    } catch (error: any) {
      console.log('[MoreInfo] SAVE FAILED:', error?.message, error?.response?.data);
      alert(
        'Save failed',
        getUserFriendlyMessage(error, 'We could not save your profile details right now.'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Header />
      <ScrollView
        style={[styles.scrollView, { backgroundColor: themeColors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
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
    backgroundColor: Colors.background,
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
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 12,
    paddingHorizontal: 16,
  },
});


