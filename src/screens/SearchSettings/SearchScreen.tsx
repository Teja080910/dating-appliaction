import { ScrollView, StyleSheet, View } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import SearchSettingsHeader from '../../components/SearchSettingsComponents/SearchSettingHeader';
import AgeRangeSlider from '../../components/SearchSettingsComponents/AgeRange';
import DistanceSlider from '../../components/SearchSettingsComponents/DistanceRange';
import SearchWorldWide from '../../components/SearchSettingsComponents/SearchWorldWide';
import Location from '../../components/SearchSettingsComponents/Location';
import BodyHeight from '../../components/SearchSettingsComponents/BodyHeight';
import BodyType from '../../components/SearchSettingsComponents/BodyType';
import Appearance from '../../components/SearchSettingsComponents/Appearance';
import Languages from '../../components/SearchSettingsComponents/Languages';
import EnglishProficiency from '../../components/SearchSettingsComponents/EnglishProficiency';
import Ethnicity from '../../components/SearchSettingsComponents/Ethnicity';
import Smoke from '../../components/SearchSettingsComponents/Smoke';
import LookingFor from '../../components/SearchSettingsComponents/LookingFor';
import ShowMe from '../../components/SearchSettingsComponents/ShowMe';
import SaveResetButtons from '../../components/SearchSettingsComponents/SaveResetButtons';

import AppContext from '../../context/CreateGlobalStateContext';
import { Colors, Spacing } from '../../theme';
import { useAlert } from '../../components/AlertModal';

const SearchScreen = ({ navigation }: any) => {
  const { alert, AlertComponent } = useAlert();
  const {
    setAgeRange,
    setDistanceRange,
    setBodyHeight,
    setSearchLanguages,
    setEnglishProficiency,
    setEthnicity,
    setLookingFor,
    setShowMe,
    setSmoke,
    setIsChecked,
    setLocation,
  } = React.useContext(AppContext);

  const [, setFilters] = React.useState<any>({
    minAge: 18, maxAge: 40, maxDistanceKm: 50, worldwide: false,
    bodyType: [], appearance: [], language: [], englishLevel: [],
    ethnicity: [], lookingFor: [], gender: [], smoke: false, drink: false,
    page: 0, size: 10,
  });

  const handleSave = async () => {
    alert('Filters Applied', 'Updated matches will refresh on the home screen.');
    navigation.goBack();
  };

  const handleReset = () => {
    setFilters({
      minAge: 18, maxAge: 40, maxDistanceKm: 50, worldwide: false,
      bodyType: [], appearance: [], language: [], englishLevel: [],
      ethnicity: [], lookingFor: [], gender: [], smoke: false, drink: false,
      page: 0, size: 10,
    });
    setAgeRange([18, 40]);
    setDistanceRange(50);
    setBodyHeight([120, 200]);
    setSearchLanguages([]);
    setEnglishProficiency([]);
    setEthnicity([]);
    setLookingFor([]);
    setShowMe(null);
    setSmoke([]);
    setIsChecked(false);
    setLocation('My current location');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <SearchSettingsHeader onClose={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <AgeRangeSlider onChange={(min: number, max: number) => {
            setAgeRange([min, max]);
            setFilters((prev: any) => ({ ...prev, minAge: min, maxAge: max }));
          }} />

          <DistanceSlider onChange={(val: number) => {
            setDistanceRange(val);
            setFilters((prev: any) => ({ ...prev, maxDistanceKm: val }));
          }} />

          <SearchWorldWide onToggle={(val: boolean) =>
            setFilters((prev: any) => ({ ...prev, worldwide: val }))
          } />

          <Location />

          <BodyHeight onChange={(min: number, max: number) => {
            setBodyHeight([min, max]);
            setFilters((prev: any) => ({ ...prev, minHeight: min, maxHeight: max }));
          }} />

          <BodyType onChange={(val: string[]) =>
            setFilters((prev: any) => ({ ...prev, bodyType: val }))
          } />

          <Appearance onChange={(val: string[]) =>
            setFilters((prev: any) => ({ ...prev, appearance: val }))
          } />

          <Languages onChange={(val: string[]) => {
            setSearchLanguages(val);
            setFilters((prev: any) => ({ ...prev, language: val }));
          }} />

          <EnglishProficiency onChange={(val: string[]) => {
            setEnglishProficiency(val);
            setFilters((prev: any) => ({ ...prev, englishLevel: val }));
          }} />

          <Ethnicity onChange={(val: string[]) => {
            setEthnicity(val);
            setFilters((prev: any) => ({ ...prev, ethnicity: val }));
          }} />

          <Smoke onChange={(val: boolean) =>
            setFilters((prev: any) => ({ ...prev, smoke: val }))
          } />

          <LookingFor onChange={(val: string[]) => {
            setLookingFor(val);
            setFilters((prev: any) => ({ ...prev, lookingFor: val }));
          }} />

          <ShowMe onChange={(val: string[]) => {
            setShowMe((val?.[0] as 'straight_man' | 'straight_woman' | null) || null);
            setFilters((prev: any) => ({ ...prev, gender: val }));
          }} />
        </View>
      </ScrollView>

      <SaveResetButtons onSave={handleSave} onReset={handleReset} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
});

export default SearchScreen;
