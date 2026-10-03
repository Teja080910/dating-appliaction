import React, { useContext, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useProfile } from '../../api/useProfile';
import AppearanceSelector from '../../components/MoreInfoTabComponents/AppearanceSelector';
import BodyTypeSelector from '../../components/MoreInfoTabComponents/BodyTypeSelector';
import DoYouSmokeSelector from '../../components/MoreInfoTabComponents/DoYouSmokeSelector';
import DrinkingSelector from '../../components/MoreInfoTabComponents/DrinkingSelector';
import EnglishSkillSelector from '../../components/MoreInfoTabComponents/EnglishSkillSelector';
import EthnicitySelector from '../../components/MoreInfoTabComponents/EthnicitySelector';
import Header from '../../components/MoreInfoTabComponents/Header';
import HeightSelector from '../../components/MoreInfoTabComponents/HeightSelector';
import LanguagesSelector from '../../components/MoreInfoTabComponents/LanguagesSelector';
import LookingForSelector from '../../components/MoreInfoTabComponents/LookingForSelector';
import SaveButton from '../../components/MoreInfoTabComponents/SaveButton';
import AppContext from '../../context/CreateGlobalStateContext';
import { getAuthSession } from '../../utils/session';
import { Colors } from '../../theme';
import { useAlert } from '../../components/AlertModal';
import { getUserFriendlyMessage } from '../../utils/userFriendlyMessages';

const HIDDEN_PROFILE_LANGUAGES = new Set(['telugu']);
const HIDDEN_LOOKING_FOR_VALUES = new Set(['long-term relationship']);

const MoreInfoScreen = () => {
  const { alert, AlertComponent } = useAlert();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
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
    setSelectedDrinking,
    selectedLookingFor,
    setSelectedLookingFor,
  } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const { updateDetails, updatePreferences, useMyProfile } = useProfile();
  const profileQuery = useMyProfile(undefined);

  useEffect(() => {
    const profile = profileQuery.data;
    if (!profile) {
      return;
    }

    console.log('[MoreInfo] Profile loaded from API:', JSON.stringify({
      ethnicity: profile.ethnicity,
      lookingFor: profile.lookingFor,
      smoke: profile.smoke,
      drink: profile.drink,
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

    const englishLevelMap = ['beginner', 'intermediate', 'advanced', 'native'];
    const englishIndex = englishLevelMap.indexOf(String(profile.englishLevel || '').toLowerCase());

    if (profile.height) {
      setHeight(Number(profile.height));
    }
    setSelectedAppearance(profile.appearance || null);
    setSelectedBodyType(profile.bodyType || null);
    setSelectedLanguages(visibleLanguages);
    setSelectedEthinicity(profile.ethnicity || null);
    setSelectedSmoking(profile.smoke || null);
    setSelectedDrinking(profile.drink || null);
    setSelectedLookingFor(visibleLookingFor);
    if (englishIndex >= 0) {
      setEnglishSkillLevel(englishIndex);
    }
  }, [profileQuery.data, setEnglishSkillLevel, setHeight, setSelectedAppearance, setSelectedBodyType, setSelectedDrinking, setSelectedEthinicity, setSelectedLanguages, setSelectedLookingFor, setSelectedSmoking]);

  const handleSave = async () => {
    const authSession = await getAuthSession();
    const hasUsableSessionToken = Boolean(authSession?.token);

    if (!hasUsableSessionToken) {
      alert('Session error', 'Please log in again to continue.');
      return;
    }

    try {
      setLoading(true);

      const englishLevelStr = ['beginner', 'intermediate', 'advanced', 'native'][englishSkillLevel] || '';
      const languageStr = Array.isArray(selectedLanguages) ? selectedLanguages.join(', ') : '';
      const lookingForStr = Array.isArray(selectedLookingFor) ? selectedLookingFor.join(', ') : '';

      const detailsPayload = {
        language: languageStr,
        appearance: selectedAppearance || '',
        bodyType: selectedBodyType || '',
        height: Number(height) || 0,
        englishLevel: englishLevelStr,
        ethnicity: selectedEthinicity || '',
      };

      const prefsPayload = {
        lookingFor: lookingForStr,
        smoke: selectedSmoking || '',
        drink: selectedDrinking || '',
        ethnicity: selectedEthinicity || '',
      };

      // Save these partial profile updates in order. Sending both requests at
      // the same time can cause the slower response to overwrite fields saved
      // by the other request on APIs that persist the full profile row.
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
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView
        style={styles.scrollView}
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
          <DrinkingSelector />
          <LookingForSelector />
        </View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
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
    paddingBottom: 24,
  },
  content: {
    flex: 1,
  },
  footer: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.glassBorder,
    paddingTop: 12,
  },
  closeButton: {
    marginHorizontal: 24,
    marginBottom: 12,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
