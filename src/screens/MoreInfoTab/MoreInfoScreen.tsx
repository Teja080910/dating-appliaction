import React, { useContext, useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
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
import { profileApi } from '../../api/profileApi';
import { AuthStorage } from '../../api/authStorage';
import AppContext from '../../context/CreateGlobalStateContext';

const englishLevels = ['Bad', 'Medium', 'Good', 'Very Good'];

const MoreInfoScreen = () => {
  const {
    setSelectedAppearance,
    setSelectedBodyType,
    setEnglishSkillLevel,
    setSelectedEthinicity,
    setSelectedSmoking,
    setTempHeight,
    setSelectedLanguages,
    setSelectedLookingFor, setSelectedNetWorth, setSelectedKidCount,
  } = useContext(AppContext);

  const [loading, setLoading] = useState(true);

  const fetchAndPrefill = useCallback(async () => {
    setLoading(true);
    try {
      const userIdStr = await AuthStorage.getUserIdStr();
      if (!userIdStr) return;
      const data = await profileApi.getMyProfile(userIdStr);
      if (data.appearance) setSelectedAppearance(data.appearance);
      if (data.bodyType) setSelectedBodyType(data.bodyType);
      if (data.englishLevel) {
        const idx = englishLevels.indexOf(data.englishLevel);
        if (idx >= 0) setEnglishSkillLevel(idx);
      }
      if (data.ethnicity) setSelectedEthinicity(data.ethnicity);
      if (data.smoke) setSelectedSmoking(data.smoke);
      if (data.height) setTempHeight(data.height);
      if (data.language) {
        setSelectedLanguages(data.language.split(',').map(s => s.trim()).filter(Boolean));
      }
      if (data.lookingFor) {
        setSelectedLookingFor(data.lookingFor.split(',').map(s => s.trim()).filter(Boolean));
      }
    } catch {}
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAndPrefill();
    }, [fetchAndPrefill])
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#D9534F" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
      </ScrollView>
      <SaveButton />
    </View>
  );
};

export default MoreInfoScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 150 },
});
