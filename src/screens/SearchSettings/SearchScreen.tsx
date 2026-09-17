import { ScrollView, StyleSheet, View, Keyboard } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

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
import Drinking from '../../components/SearchSettingsComponents/Drinking';
import OnlineOnly from '../../components/SearchSettingsComponents/OnlineOnly';
import LookingFor from '../../components/SearchSettingsComponents/LookingFor';
import ShowMe from '../../components/SearchSettingsComponents/ShowMe';
import SaveResetButtons from '../../components/SearchSettingsComponents/SaveResetButtons';

import AppContext from '../../context/CreateGlobalStateContext';
import { Colors } from '../../theme';
import { useAlert } from '../../components/AlertModal';
import { useDiscovery } from '../../api/useDiscovery';
import { getUserId } from '../../utils/sessionHelper';
import { clearAuthSession } from '../../utils/session';
import { CommonActions } from '@react-navigation/native';

const SearchScreen = ({ navigation }: any) => {
  const { alert, AlertComponent } = useAlert();
  const [saving, setSaving] = useState(false);
  const { filterUsers } = useDiscovery();
  const {
    ageRange,
    setAgeRange,
    distanceRange,
    setDistanceRange,
    bodyHeight,
    setBodyHeight,
    searchLanguages,
    setSearchLanguages,
    englishProficiency,
    setEnglishProficiency,
    ethnicity,
    setEthnicity,
    lookingFor,
    setLookingFor,
    smokeFilter,
    setSmokeFilter,
    drinkFilter,
    setDrinkFilter,
    showMe,
    setShowMe,
    setIsChecked,
    setLocation,
    setFilter,
    setFilteredProfiles,
    setSelectedOptions,
    setSelectBodyTypes,
  } = React.useContext(AppContext);

  const [filters, setFilters] = React.useState<any>(() => ({
    minAge: ageRange?.[0] ?? 18,
    maxAge: ageRange?.[1] ?? 40,
    maxDistanceKm: distanceRange ?? 50,
    worldwide: false,
    bodyType: [],
    appearance: [],
    language: searchLanguages || [],
    englishLevel: englishProficiency || [],
    ethnicity: ethnicity || [],
    lookingFor: lookingFor || [],
    gender: showMe ? [showMe === 'straight_man' ? 'Male' : 'Female'] : [],
    smoke: smokeFilter,
    drink: drinkFilter,
    onlyOnline: false,
    page: 0,
    size: 10,
  }));

  const handleSave = async () => {
    try {
      setSaving(true);
      Keyboard.dismiss();
      const resolvedUserId = await getUserId();
      const payload = {
        userId: resolvedUserId || undefined,
        minAge: filters.minAge,
        maxAge: filters.maxAge,
        maxDistanceKm: filters.maxDistanceKm,
        worldwide: filters.worldwide,
        bodyType: filters.bodyType,
        appearance: filters.appearance,
        language: filters.language,
        englishLevel: filters.englishLevel,
        ethnicity: filters.ethnicity,
        lookingFor: filters.lookingFor,
        gender: filters.gender,
        smoke: filters.smoke,
        drink: filters.drink,
        onlyOnline: filters.onlyOnline,
        minHeight: filters.minHeight,
        maxHeight: filters.maxHeight,
        page: 0,
        size: 20,
      };
      const result = await filterUsers.mutateAsync(payload);
      setSmokeFilter?.(filters.smoke);
      setDrinkFilter?.(filters.drink);
      setFilteredProfiles(result.content || []);
      setFilter('online');
      alert('Filters Applied', 'Matches updated successfully.');
      navigation.goBack();
    } catch (err: any) {
      const serverMessage =
        err?.response?.data?.message ||
        err?.response?.data ||
        (typeof err?.message === 'string' ? err.message : null);
      if (err?.response?.status === 401) {
        await clearAuthSession();
        alert('Session Expired', 'Please login again to continue.');
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          })
        );
      } else {
        alert(
          'Error',
          serverMessage
            ? `Failed to apply filters: ${String(serverMessage)}`
            : 'Failed to apply filters. Please try again.',
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFilters({
      minAge: 18, maxAge: 40, maxDistanceKm: 50, worldwide: false,
      bodyType: [], appearance: [], language: [], englishLevel: [],
      ethnicity: [], lookingFor: [], gender: [], smoke: undefined, drink: undefined,
      onlyOnline: false,
      page: 0, size: 10,
    });
    setSmokeFilter?.(undefined);
    setDrinkFilter?.(undefined);
    setAgeRange([18, 40]);
    setDistanceRange(50);
    setBodyHeight([120, 200]);
    setSearchLanguages([]);
    setEnglishProficiency([]);
    setEthnicity([]);
    setLookingFor([]);
    setSelectedOptions([]);
    setSelectBodyTypes([]);
    setShowMe(null);
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

          <Smoke value={filters.smoke} onChange={(val: boolean | undefined) =>
            setFilters((prev: any) => ({ ...prev, smoke: val }))
          } />

          <Drinking value={filters.drink} onChange={(val: boolean | undefined) =>
            setFilters((prev: any) => ({ ...prev, drink: val }))
          } />

          <OnlineOnly
            value={filters.onlyOnline}
            onChange={(val: boolean) => setFilters((prev: any) => ({ ...prev, onlyOnline: val }))}
          />

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

      <SaveResetButtons
        onSave={handleSave}
        onReset={handleReset}
        saving={saving}
      />
      {AlertComponent}
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
