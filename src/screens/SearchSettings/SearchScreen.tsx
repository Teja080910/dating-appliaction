


import { ScrollView, StyleSheet, Text, View, SafeAreaView } from 'react-native'
import React from 'react'
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

const SearchScreen = ({ navigation }: any) => {
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
})
