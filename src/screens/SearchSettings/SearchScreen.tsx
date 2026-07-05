


import { ScrollView, StyleSheet, Text, View, SafeAreaView, TouchableOpacity } from 'react-native'
import React, { useContext } from 'react'
import AppContext from '../../context/CreateGlobalStateContext'
import { SearchFilterRequest } from '../../api/types'
import SearchSettingsHeader from '../../components/SearchSettingsComponents/SearchSettingHeader'
import AgeRangeSlider from '../../components/SearchSettingsComponents/AgeRange'
import DistanceSlider from '../../components/SearchSettingsComponents/DistanceRange'
import SearchWorldWide from '../../components/SearchSettingsComponents/SearchWorldWide'
import Location from '../../components/SearchSettingsComponents/Location'
import BodyHeight from '../../components/SearchSettingsComponents/BodyHeight'
import BodyType from '../../components/SearchSettingsComponents/BodyType'
import Appearance from '../../components/SearchSettingsComponents/Appearance'
import Languages from '../../components/SearchSettingsComponents/Laguages'
import EnglishProficiency from '../../components/SearchSettingsComponents/EnglishProficiency'
import Ethnicity from '../../components/SearchSettingsComponents/Ethinicity'
import Smoke from '../../components/SearchSettingsComponents/Smoke'
import LookingFor from '../../components/SearchSettingsComponents/LookingFor'
import ShowMe from '../../components/SearchSettingsComponents/ShowMe'
import SaveResetButtons from '../../components/SearchSettingsComponents/SaveResetButtons'
import { colors, radius } from '../../constants/theme'

const SearchScreen = ({ navigation }: any) => {
  const { ageRange, showMe, searchLanguages, ethnicity, smoke } = useContext(AppContext);

  const handleSearch = () => {
    const filters: SearchFilterRequest = {};
    if (showMe === 'straight_woman') filters.gender = 'female';
    else if (showMe === 'straight_man') filters.gender = 'male';
    if (ageRange?.length === 2) {
      filters.minAge = ageRange[0];
      filters.maxAge = ageRange[1];
    }
    if (searchLanguages?.length) filters.language = searchLanguages.join(',');
    if (ethnicity?.length) filters.ethnicity = ethnicity.join(',');
    if (smoke?.length) filters.smoke = smoke.join(',');
    navigation.navigate('SearchResults', { filters });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <SearchSettingsHeader onClose={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <AgeRangeSlider />
        <DistanceSlider />
        <SearchWorldWide />
        <Location />
        <BodyHeight />
        <BodyType />
        <Appearance />
        <Languages />
        <EnglishProficiency />
        <Ethnicity />
        <Smoke />
        <LookingFor />
        <ShowMe />

        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </ScrollView>

      <SaveResetButtons />
    </SafeAreaView>
  )
}

export default SearchScreen

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    // backgroundColor: '#dd3',
  },
  scrollContent: {
    paddingBottom: 30, // enough space for Save/Reset buttons
    // paddingHorizontal: 10,
  },
  searchBtn: {
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  searchBtnText: { color: colors.surface, fontWeight: '700', fontSize: 16 },
})
