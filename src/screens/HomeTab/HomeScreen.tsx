import React, { useCallback, useContext, useEffect, useState } from 'react';
import { View, BackHandler, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppContext from '../../context/CreateGlobalStateContext';
import { profileApi } from '../../api/profileApi';
import { AuthStorage } from '../../api/authStorage';
import UserList from '../../components/HomeTabComponents/UserList';
import HomeHeader from '../../components/HomeTabComponents/HomeHeader';

const HomeScreen = () => {
  const { oppositeGender, setOppositeGender, filter, setFilter } = useContext(AppContext);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchGender = async () => {
      try {
        const userIdStr = await AuthStorage.getUserIdStr();
        if (userIdStr) {
          const profile = await profileApi.getMyProfile(userIdStr);
          const gender = profile?.gender || '';
          if (gender === 'female') {
            setOppositeGender('male');
          } else if (gender === 'male') {
            setOppositeGender('female');
          } else {
            setOppositeGender('other');
          }
        }
      } catch {
        try {
          const userData = await AuthStorage.getUser();
          const gender = userData?.gender || '';
          if (gender === 'female') {
            setOppositeGender('male');
          } else if (gender === 'male') {
            setOppositeGender('female');
          } else {
            setOppositeGender('other');
          }
        } catch {
          setOppositeGender('other');
        }
      }
    };
    fetchGender();
  }, []);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.setItem('entryHomeScreen', 'true');

      const onBackPress = () => {
        BackHandler.exitApp();
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => backHandler.remove();
    }, [])
  );

  return (
    <View style={styles.container}>
      <HomeHeader
        selectedFilter={filter}
        onFilterChange={setFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      {oppositeGender ? (
        <UserList
          filterByGender={oppositeGender}
          searchQuery={searchQuery}
        />
      ) : (
        <ActivityIndicator size="large" color="#FF1493" />
      )}
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
