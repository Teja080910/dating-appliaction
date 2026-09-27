import { ScrollView, StyleSheet, View, Keyboard } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import SearchSettingsHeader from '../../components/SearchSettingsComponents/SearchSettingHeader';
import AgeRangeSlider from '../../components/SearchSettingsComponents/AgeRange';
import DistanceSlider from '../../components/SearchSettingsComponents/DistanceRange';
import SearchWorldWide from '../../components/SearchSettingsComponents/SearchWorldWide';
import Location from '../../components/SearchSettingsComponents/Location';
import OnlineOnly from '../../components/SearchSettingsComponents/OnlineOnly';
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
  } = React.useContext(AppContext);

  const [filters, setFilters] = React.useState<any>(() => ({
    minAge: ageRange?.[0] ?? 18,
    maxAge: ageRange?.[1] ?? 40,
    maxDistanceKm: distanceRange ?? 50,
    worldwide: isChecked || false,
    gender: ['Female'],
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
        maxDistanceKm: filters.maxDistanceKm,
        worldwide: filters.worldwide,
        gender: ['Female'],
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
          gender: ['Female'],
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
      gender: ['Female'],
      onlyOnline: false,
      page: 0,
      size: 20,
    });
    setAgeRange([18, 40]);
    setDistanceRange(50);
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
