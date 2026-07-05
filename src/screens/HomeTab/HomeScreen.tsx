import React, { useCallback, useState } from 'react';
import { View, BackHandler, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthStorage } from '../../api/authStorage';
import UserList from '../../components/HomeTabComponents/UserList';
import HomeHeader from '../../components/HomeTabComponents/HomeHeader';

const HomeScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.setItem(AuthStorage.KEYS.ENTRY_HOME_SCREEN, 'true');

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
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <UserList searchQuery={searchQuery} />
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
