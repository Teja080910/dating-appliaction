import React, { useContext, useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Header from '../../components/MoreInfoTabComponents/Header';
import AgeSelector from '../../components/MoreInfoTabComponents/AgeSelector';
import HeightSelector from '../../components/MoreInfoTabComponents/HeightSelector';
import BodyTypeSelector from '../../components/MoreInfoTabComponents/BodyTypeSelector';
import AppearanceSelector from '../../components/MoreInfoTabComponents/AppearanceSelector';
import LanguagesSelector from '../../components/MoreInfoTabComponents/LanguagesSelector';
import EnglishSkillSelector from '../../components/MoreInfoTabComponents/EnglishSkillSelector';
import EthnicitySelector from '../../components/MoreInfoTabComponents/EthnicitySelector';
import DoYouSmokeSelector from '../../components/MoreInfoTabComponents/DoYouSmokeSelector';
import DoYouDrinkSelector from '../../components/MoreInfoTabComponents/DoYouDrinkSelector';
import LookingForSelector from '../../components/MoreInfoTabComponents/LookingForSelector';
import SaveButton from '../../components/MoreInfoTabComponents/SaveButton';
import { profileApi } from '../../api/profileApi';
import { AuthStorage } from '../../api/authStorage';
import AppContext from '../../context/CreateGlobalStateContext';
import { ENGLISH_LEVELS as englishLevels } from '../../constants/profileOptions';
import { colors } from '../../constants/theme';

const MoreInfoScreen = () => {
  const {
    setSelectedAppearance,
    setSelectedBodyType,
    setEnglishSkillLevel,
    setSelectedEthinicity,
    setSelectedSmoking,
    setSelectedDrink,
    setTempHeight,
    setSelectedLanguages,
  } = useContext(AppContext);

  const [loading, setLoading] = useState(true);

  const fetchAndPrefill = useCallback(async () => {
    setLoading(true);
    try {
      const userData = await AuthStorage.getUser();
      const uidNum = userData?.ID || (await AuthStorage.getUserId());
      const uidStr = userData?.userId || (await AuthStorage.getUserIdStr());
      const ids = [uidStr, uidNum ? String(uidNum) : null].filter(Boolean);
      let data: any = {};
      for (const id of ids) {
        try {
          data = await profileApi.getMyProfile(id!);
          break;
        } catch {
          continue;
        }
      }
      if (!data || !data.id) {
        data = userData?.profile || {};
      }
      if (data.appearance) setSelectedAppearance(data.appearance);
      if (data.bodyType) setSelectedBodyType(data.bodyType);
      if (data.englishLevel) {
        const idx = englishLevels.indexOf(data.englishLevel);
        if (idx >= 0) setEnglishSkillLevel(idx);
      }
      if (data.ethnicity) setSelectedEthinicity(data.ethnicity);
      if (data.smoke) setSelectedSmoking(data.smoke);
      if (data.drink) setSelectedDrink(data.drink);
      if (data.height) setTempHeight(data.height);
      if (data.language) {
        setSelectedLanguages(data.language.split(',').map(s => s.trim()).filter(Boolean));
      }
      // /profile/me never returns lookingFor/dob (confirmed against the live
      // backend) — selectedLookingFor/date are carried via shared context.
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
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <AgeSelector />
        <HeightSelector />
        <BodyTypeSelector />
        <AppearanceSelector />
        <LanguagesSelector />
        <EnglishSkillSelector />
        <EthnicitySelector />
        <DoYouSmokeSelector />
        <DoYouDrinkSelector />
        <LookingForSelector />
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
