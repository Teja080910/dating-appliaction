import React, { useContext, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/MoreInfoTabComponents/Header';
import HeightSelector from '../../components/MoreInfoTabComponents/HeightSelector';
import BodyTypeSelector from '../../components/MoreInfoTabComponents/BodyTypeSelector';
import AppearanceSelector from '../../components/MoreInfoTabComponents/AppearanceSelector';
import LanguagesSelector from '../../components/MoreInfoTabComponents/LanguagesSelector';
import EnglishSkillSelector from '../../components/MoreInfoTabComponents/EnglishSkillSelector';
import EthnicitySelector from '../../components/MoreInfoTabComponents/EthnicitySelector';
import DoYouSmokeSelector from '../../components/MoreInfoTabComponents/DoYouSmokeSelector';
import KidsCountSelector from '../../components/MoreInfoTabComponents/KidsCountSelector';
import LookingForSelector from '../../components/MoreInfoTabComponents/LookingForSelector';
import NetWorthSelector from '../../components/MoreInfoTabComponents/NetWorthSelector';
import SaveButton from '../../components/MoreInfoTabComponents/SaveButton';
import AppContext from '../../context/CreateGlobalStateContext';
import { useProfile } from '../../api/useProfile';
import { getAuthSession } from '../../utils/session';

const MoreInfoScreen = () => {
  const tabBarHeight = useBottomTabBarHeight();
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
  const { setupProfile, updateDetails, updatePreferences, useMyProfile } = useProfile();
  const profileQuery = useMyProfile(undefined);

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

    const englishLevelMap = ['beginner', 'intermediate', 'advanced', 'native'];
    const englishIndex = englishLevelMap.indexOf(String(profile.englishLevel || '').toLowerCase());

    if (profile.height) {
      setHeight(Number(profile.height));
    }
    setSelectedAppearance(profile.appearance || null);
    setSelectedBodyType(profile.bodyType || null);
    setSelectedLanguages(splitValues(profile.language));
    setSelectedEthinicity(profile.ethnicity || null);
    setSelectedSmoking(profile.smoke || null);
    setSelectedDrinking(profile.drink || null);
    setSelectedLookingFor(splitValues(profile.lookingFor));
    if (englishIndex >= 0) {
      setEnglishSkillLevel(englishIndex);
    }
  }, [profileQuery.data, setEnglishSkillLevel, setHeight, setSelectedAppearance, setSelectedBodyType, setSelectedDrinking, setSelectedEthinicity, setSelectedLanguages, setSelectedLookingFor, setSelectedSmoking]);

  const handleSave = async () => {
    const authSession = await getAuthSession();
    const hasUsableSessionToken = Boolean(authSession?.token);

    if (!hasUsableSessionToken) {
      Alert.alert('Session error', 'Please log in again to continue.');
      return;
    }

    try {
      setLoading(true);
      await updateDetails.mutateAsync({
        language: Array.isArray(selectedLanguages) ? selectedLanguages.join(', ') : '',
        appearance: selectedAppearance || '',
        bodyType: selectedBodyType || '',
        height: Number(height) || 0,
      });

      await updatePreferences.mutateAsync({
        lookingFor: Array.isArray(selectedLookingFor) ? selectedLookingFor.join(', ') : '',
        smoke: selectedSmoking || '',
        drink: selectedDrinking || '',
      });

      // Note: Backend does not currently support updating englishLevel and ethnicity via /update API.
      // Calling setupProfile here without a photo triggers a 400/Multipart network crash.
      // await setupProfile.mutateAsync({
      //   dto: {
      //     englishLevel: ['Beginner', 'Intermediate', 'Advanced', 'Native'][englishSkillLevel] || 'Beginner',
      //     ethnicity: selectedEthinicity || '',
      //   },
      // });

      Alert.alert('Saved', 'Your profile details have been updated.');
    } catch (error: any) {
      Alert.alert(
        'Save failed',
        error?.response?.data?.message || 'Could not save your profile details right now.',
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
          <KidsCountSelector />
          <LookingForSelector />
          <NetWorthSelector />
        </View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: tabBarHeight + 8 }]}>
        <SaveButton onPress={handleSave} loading={loading || profileQuery.isLoading} />
      </View>
    </SafeAreaView>
  );
};

export default MoreInfoScreen;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
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
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F2F2F2',
    paddingTop: 12,
  },
});
