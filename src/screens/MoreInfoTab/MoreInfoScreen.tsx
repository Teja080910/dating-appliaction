import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
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

const MoreInfoScreen = () => {
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
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  scrollContent: { 
    paddingBottom: 150, // Only this one is needed
  },
});
