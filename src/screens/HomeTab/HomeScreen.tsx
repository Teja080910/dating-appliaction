import React, { useCallback, useContext, useEffect, useState } from 'react';
import { View, BackHandler, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppContext from '../../context/CreateGlobalStateContext';
import { getGender } from '../../utils/types/AsyncStorage';
import UserList from '../../components/HomeTabComponents/UserList';
import HomeHeader from '../../components/HomeTabComponents/HomeHeader';

const HomeScreen = () => {
  const { oppositeGender, setOppositeGender, filter, setFilter } = useContext(AppContext);
  const [userLocation] = useState<{ latitude: number, longitude: number } | null>(null);

  useEffect(() => {
    const fetchGender = async () => {
      const gender = await getGender();
      console.log("gender in home:", gender);
      if (gender === 'straight_woman') {
        setOppositeGender('straight_man');
      } else if (gender === 'straight_man') {
        setOppositeGender('straight_woman');
      } else {
        setOppositeGender('lgbtqia');
      }
    };
    fetchGender();
  }, [setOppositeGender]);

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

  const handleMenuPress = () => {
    console.log('Menu pressed');
  };

  return (
    <View style={styles.container}>
      <HomeHeader
        selectedFilter={filter}
        onFilterChange={setFilter}
        onMenuPress={handleMenuPress}
      />
      {oppositeGender ? (
        <UserList
          filterByGender={oppositeGender}
          mode={filter}
          userLocation={userLocation}
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
    backgroundColor: '#FFFFFF',
  },
});
