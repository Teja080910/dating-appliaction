import React, { useCallback, useContext, useEffect, useState } from 'react';
import { View, BackHandler, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppContext from '../../context/CreateGlobalStateContext';
import { getGender } from '../../utils/types/AsyncStorage';
import UserList from '../../components/HomeTabComponents/UserList';
import HomeHeader from '../../components/HomeTabComponents/HomeHeader';
import { Colors, useTheme } from '../../theme';
import { getCurrentLocation } from '../../utils/geolocation';
import RequestsInboxScreen from '../RequestsTab/RequestsInboxScreen';
import apiClient from '../../api/apiClient';
import { getUserId } from '../../utils/sessionHelper';

const HomeScreen = () => {
  const { themeColors } = useTheme();
  const {
    oppositeGender,

    setOppositeGender,
    filter,
    setFilter,
    filteredProfiles,
    setFilteredProfiles,
    setShowMe,
  } = useContext(AppContext);
  const [currentUserGender, setCurrentUserGender] = useState<'man' | 'woman' | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchGender = async () => {
      try {
        const [storedSelectedGender, storedUserGender, storedUser, storedUserData] = await Promise.all([
          getGender(),
          AsyncStorage.getItem('userGender'),
          AsyncStorage.getItem('user'),
          AsyncStorage.getItem('userData'),
        ]);

        let raw = storedSelectedGender || storedUserGender || '';

        // If not explicit or defaulted to lgbtqia, check stored user objects
        if (!raw || raw === 'lgbtqia') {
          for (const jsonStr of [storedUser, storedUserData]) {
            if (jsonStr) {
              try {
                const parsed = JSON.parse(jsonStr);
                const candidate =
                  parsed?.gender ||
                  parsed?.user?.gender ||
                  parsed?.profile?.gender ||
                  parsed?.data?.gender ||
                  parsed?.data?.user?.gender;
                if (candidate) {
                  raw = String(candidate);
                  break;
                }
              } catch {}
            }
          }
        }

        // If still not definitively known, check API profile
        if (!raw || raw === 'lgbtqia') {
          const uid = await getUserId();
          if (uid) {
            try {
              const res = await apiClient.post('/profile/me', null, { params: { userId: uid } });
              const apiGender = res?.data?.gender || res?.data?.profile?.gender;
              if (apiGender) {
                raw = String(apiGender);
              }
            } catch {
              // fallback
            }
          }
        }

        const clean = String(raw).toLowerCase();
        const isWomanUser = clean.includes('woman') || clean.includes('female');

        if (isMounted) {
          if (isWomanUser) {
            setCurrentUserGender('woman');
            setOppositeGender('straight_man');
            setShowMe('straight_man');
            await AsyncStorage.setItem('selectedGender', 'straight_woman');
            await AsyncStorage.setItem('userGender', 'straight_woman');
          } else {
            setCurrentUserGender('man');
            setOppositeGender('straight_woman');
            setShowMe('straight_woman');
            await AsyncStorage.setItem('selectedGender', 'straight_man');
            await AsyncStorage.setItem('userGender', 'straight_man');
          }
        }
      } catch (err) {
        console.warn('Error resolving user gender:', err);
        if (isMounted) {
          setCurrentUserGender('man');
          setOppositeGender('straight_woman');
          setShowMe('straight_woman');
        }
      }
    };
    fetchGender();
    return () => {
      isMounted = false;
    };
  }, [setOppositeGender]);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const location = await getCurrentLocation();
        setUserLocation(location);
      } catch {
        // Location permission denied or unavailable
      }
    };
    fetchLocation();
  }, []);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.setItem('entryHomeScreen', 'true');
      const onBackPress = () => {
        BackHandler.exitApp();
        return true;
      };
      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backHandler.remove();
    }, [])
  );

  const handleMenuPress = () => {
    console.log('Menu pressed');
  };

  const handleFilterChange = (nextFilter: 'online' | 'newest') => {
    setFilter(nextFilter);
  };

  // While resolving gender, show loading to prevent flashing browse screen to women
  if (currentUserGender === null) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  // PRD FR-16: The home screen for women shall not include browsing.
  // PRD FR-21: A woman's home screen shall show the requests she received, newest first.
  if (currentUserGender === 'woman') {
    return <RequestsInboxScreen />;
  }

  // PRD FR-12: The home screen for men shall show a list/grid of women's profiles only.
  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <HomeHeader
        selectedFilter={filter}
        onFilterChange={handleFilterChange}
        onMenuPress={handleMenuPress}
      />
      {oppositeGender ? (
        <UserList
          filterByGender={oppositeGender}
          mode={filter}
          filteredProfiles={filteredProfiles}
          userLocation={userLocation}
        />
      ) : (
        <ActivityIndicator size="large" color={themeColors.primary} />
      )}
    </View>
  );
};


export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
