import { ScrollView, StyleSheet, View, Keyboard } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import SearchSettingsHeader from '../../components/SearchSettingsComponents/SearchSettingHeader';
import AgeRangeSlider from '../../components/SearchSettingsComponents/AgeRange';
import DistanceSlider from '../../components/SearchSettingsComponents/DistanceRange';
import SearchWorldWide from '../../components/SearchSettingsComponents/SearchWorldWide';
import Location from '../../components/SearchSettingsComponents/Location';
import OnlineOnly from '../../components/SearchSettingsComponents/OnlineOnly';
import BodyHeight from '../../components/SearchSettingsComponents/BodyHeight';
import BodyType from '../../components/SearchSettingsComponents/BodyType';
import Appearance from '../../components/SearchSettingsComponents/Appearance';
import Languages from '../../components/SearchSettingsComponents/Languages';
import EnglishProficiency from '../../components/SearchSettingsComponents/EnglishProficiency';
import Ethnicity from '../../components/SearchSettingsComponents/Ethnicity';
import Smoke from '../../components/SearchSettingsComponents/Smoke';
import Drinking from '../../components/SearchSettingsComponents/Drinking';
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
    setIsChecked,
    isChecked,
    location,
    setLocation,
    setFilter,
    setFilteredProfiles,
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
    selectedOptions,
    setSelectedOptions,
    selectBodyTypes,
    setSelectBodyTypes,
    showMe,
    setShowMe,
  } = React.useContext(AppContext);

  const [filters, setFilters] = React.useState<any>(() => ({
    minAge: ageRange?.[0] ?? 18,
    maxAge: ageRange?.[1] ?? 40,
    maxDistanceKm: distanceRange ?? 50,
    worldwide: isChecked || false,
    gender: ['Male'],
    minHeight: bodyHeight?.[0] ?? 120,
    maxHeight: bodyHeight?.[1] ?? 200,
    bodyType: selectBodyTypes || [],
    appearance: selectedOptions || [],
    language: searchLanguages || [],
    englishLevel: englishProficiency || [],
    ethnicity: ethnicity || [],
    lookingFor: lookingFor || [],
    smoke: smokeFilter,
    drink: drinkFilter,
    onlyOnline: false,
    page: 0,
    size: 20,
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

          if (saved.minHeight !== undefined && saved.maxHeight !== undefined) {
            setBodyHeight([saved.minHeight, saved.maxHeight]);
          }
          if (saved.bodyType) setSelectBodyTypes(saved.bodyType);
          if (saved.appearance) setSelectedOptions(saved.appearance);
          if (saved.language) setSearchLanguages(saved.language);
          if (saved.englishLevel) setEnglishProficiency(saved.englishLevel);
          if (saved.ethnicity) setEthnicity(saved.ethnicity);
          if (saved.lookingFor) setLookingFor(saved.lookingFor);
          if (saved.smoke !== undefined) setSmokeFilter(saved.smoke);
          if (saved.drink !== undefined) setDrinkFilter(saved.drink);
          if (saved.showMe) setShowMe(saved.showMe);

          if (saved.minAge !== undefined && saved.maxAge !== undefined) {
            setAgeRange([saved.minAge, saved.maxAge]);
          }
          if (saved.maxDistanceKm !== undefined) {
            setDistanceRange(saved.maxDistanceKm);
          }
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
        minHeight: filters.minHeight,
        maxHeight: filters.maxHeight,
        bodyType: filters.bodyType,
        appearance: filters.appearance,
        language: filters.language,
        englishLevel: filters.englishLevel,
        ethnicity: filters.ethnicity,
        lookingFor: filters.lookingFor,
        smoke: filters.smoke,
        drink: filters.drink,
        maxDistanceKm: filters.maxDistanceKm,
        worldwide: filters.worldwide,
        gender: filters.gender,
        onlyOnline: filters.onlyOnline,
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
          minHeight: filters.minHeight,
          maxHeight: filters.maxHeight,
          bodyType: filters.bodyType,
          appearance: filters.appearance,
          language: filters.language,
          englishLevel: filters.englishLevel,
          ethnicity: filters.ethnicity,
          lookingFor: filters.lookingFor,
          smoke: filters.smoke,
          drink: filters.drink,
          gender: filters.gender,
          showMe: showMe,
          onlyOnline: filters.onlyOnline,
        },
        resolvedUserId
      );

      const result = await filterUsers.mutateAsync(payload);
      setFilteredProfiles(result.content || []);
      setFilter(filters.onlyOnline ? 'online' : 'newest');
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
      gender: ['Male'],
      minHeight: 120,
      maxHeight: 200,
      bodyType: [],
      appearance: [],
      language: [],
      englishLevel: [],
      ethnicity: [],
      lookingFor: [],
      smoke: undefined,
      drink: undefined,
      onlyOnline: false,
      page: 0,
      size: 20,
    });
    setAgeRange([18, 40]);
    setDistanceRange(50);
    setBodyHeight([120, 200]);
    setSelectBodyTypes([]);
    setSelectedOptions([]);
    setSearchLanguages([]);
    setEnglishProficiency([]);
    setEthnicity([]);
    setLookingFor([]);
    setSmokeFilter(undefined);
    setDrinkFilter(undefined);
    setShowMe('straight_man');
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
          <AgeRangeSlider
            onChange={(min: number, max: number) => {
              setAgeRange([min, max]);
              setFilters((prev: any) => ({ ...prev, minAge: min, maxAge: max }));
            }}
          />

          <DistanceSlider
            onChange={(val: number) => {
              setDistanceRange(val);
              setFilters((prev: any) => ({ ...prev, maxDistanceKm: val }));
            }}
          />

          <SearchWorldWide
            onToggle={(val: boolean) =>
              setFilters((prev: any) => ({ ...prev, worldwide: val }))
            }
          />

          <Location />

          <OnlineOnly
            value={filters.onlyOnline}
            onChange={(val: boolean) =>
              setFilters((prev: any) => ({ ...prev, onlyOnline: val }))
            }
          />

          <BodyHeight
            onChange={(min: number, max: number) => {
              setBodyHeight([min, max]);
              setFilters((prev: any) => ({ ...prev, minHeight: min, maxHeight: max }));
            }}
          />
          <BodyType onChange={(value) => setFilters((prev: any) => ({ ...prev, bodyType: value }))} />
          <Appearance onChange={(value) => setFilters((prev: any) => ({ ...prev, appearance: value }))} />
          <Languages onChange={(value) => setFilters((prev: any) => ({ ...prev, language: value }))} />
          <EnglishProficiency onChange={(value) => setFilters((prev: any) => ({ ...prev, englishLevel: value }))} />
          <Ethnicity onChange={(value) => setFilters((prev: any) => ({ ...prev, ethnicity: value }))} />
          <Smoke
            value={filters.smoke}
            onChange={(value) => setFilters((prev: any) => ({ ...prev, smoke: value }))}
          />
          <Drinking
            value={filters.drink}
            onChange={(value) => setFilters((prev: any) => ({ ...prev, drink: value }))}
          />
          <LookingFor onChange={(value) => setFilters((prev: any) => ({ ...prev, lookingFor: value }))} />
          <ShowMe
            onChange={(value) => setFilters((prev: any) => ({ ...prev, gender: value }))}
          />
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
