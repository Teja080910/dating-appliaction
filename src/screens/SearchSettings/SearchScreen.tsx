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
import {
  getSavedSearchFilters,
  saveSearchFilters,
  clearSavedSearchFilters,
} from '../../utils/types/AsyncStorage';
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
    isChecked,
    location,
    setLocation,
    setFilter,
    setFilteredProfiles,
    selectedOptions,
    setSelectedOptions,
    selectBodyTypes,
    setSelectBodyTypes,
  } = React.useContext(AppContext);

  const [filters, setFilters] = React.useState<any>(() => ({
    minAge: ageRange?.[0] ?? 18,
    maxAge: ageRange?.[1] ?? 40,
    maxDistanceKm: distanceRange ?? 50,
    worldwide: isChecked || false,
    bodyType: selectBodyTypes || [],
    appearance: selectedOptions || [],
    language: searchLanguages || [],
    englishLevel: englishProficiency || [],
    ethnicity: ethnicity || [],
    lookingFor: lookingFor || [],
    gender: showMe ? [showMe === 'straight_man' ? 'Male' : 'Female'] : [],
    smoke: smokeFilter,
    drink: drinkFilter,
    onlyOnline: false,
    minHeight: bodyHeight?.[0] ?? 120,
    maxHeight: bodyHeight?.[1] ?? 200,
    page: 0,
    size: 10,
  }));

  React.useEffect(() => {
    let isMounted = true;
    const loadSaved = async () => {
      try {
        const resolvedUserId = await getUserId();
        const saved = await getSavedSearchFilters(resolvedUserId);
        if (saved && isMounted) {
          setFilters((prev: any) => ({
            ...prev,
            ...saved,
            bodyType: saved.bodyType || prev.bodyType,
            appearance: saved.appearance || prev.appearance,
            language: saved.language || prev.language,
            englishLevel: saved.englishLevel || prev.englishLevel,
            ethnicity: saved.ethnicity || prev.ethnicity,
            lookingFor: saved.lookingFor || prev.lookingFor,
            gender:
              saved.gender ||
              (saved.showMe
                ? [saved.showMe === 'straight_man' ? 'Male' : 'Female']
                : prev.gender),
          }));

          if (saved.minAge !== undefined && saved.maxAge !== undefined) {
            setAgeRange([saved.minAge, saved.maxAge]);
          }
          if (saved.maxDistanceKm !== undefined) {
            setDistanceRange(saved.maxDistanceKm);
          }
          if (saved.minHeight !== undefined && saved.maxHeight !== undefined) {
            setBodyHeight([saved.minHeight, saved.maxHeight]);
          }
          if (saved.bodyType) setSelectBodyTypes(saved.bodyType);
          if (saved.appearance) setSelectedOptions(saved.appearance);
          if (saved.language) setSearchLanguages(saved.language);
          if (saved.englishLevel) setEnglishProficiency(saved.englishLevel);
          if (saved.ethnicity) setEthnicity(saved.ethnicity);
          if (saved.lookingFor) setLookingFor(saved.lookingFor);
          if (saved.showMe !== undefined) {
            setShowMe(saved.showMe);
          } else if (saved.gender?.length) {
            setShowMe(
              saved.gender[0] === 'Male' ? 'straight_man' : 'straight_woman'
            );
          }
          if (saved.smoke !== undefined) setSmokeFilter(saved.smoke);
          if (saved.drink !== undefined) setDrinkFilter(saved.drink);
          if (saved.worldwide !== undefined) setIsChecked(saved.worldwide);
          if (saved.location) setLocation(saved.location);
        }
      } catch (err) {
        console.warn('Failed to load saved search filters:', err);
      }
    };

    loadSaved();
    return () => {
      isMounted = false;
    };
  }, []);

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

      // Persist filters to AsyncStorage
      await saveSearchFilters(
        {
          minAge: filters.minAge,
          maxAge: filters.maxAge,
          maxDistanceKm: filters.maxDistanceKm,
          worldwide: filters.worldwide,
          location: location,
          bodyType: filters.bodyType,
          appearance: filters.appearance,
          language: filters.language,
          englishLevel: filters.englishLevel,
          ethnicity: filters.ethnicity,
          lookingFor: filters.lookingFor,
          gender: filters.gender,
          showMe: showMe,
          smoke: filters.smoke,
          drink: filters.drink,
          onlyOnline: filters.onlyOnline,
          minHeight: filters.minHeight,
          maxHeight: filters.maxHeight,
        },
        resolvedUserId
      );

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

  const handleReset = async () => {
    const resolvedUserId = await getUserId();
    await clearSavedSearchFilters(resolvedUserId);

    setFilters({
      minAge: 18,
      maxAge: 40,
      maxDistanceKm: 50,
      worldwide: false,
      bodyType: [],
      appearance: [],
      language: [],
      englishLevel: [],
      ethnicity: [],
      lookingFor: [],
      gender: [],
      smoke: undefined,
      drink: undefined,
      onlyOnline: false,
      minHeight: 120,
      maxHeight: 200,
      page: 0,
      size: 10,
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
