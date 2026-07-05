import React, { useContext } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppContext from '../../context/CreateGlobalStateContext';
import { colors, radius } from '../../constants/theme';

const SaveResetButtons = () => {
  const {
    ageRange,
    distanceRange,
    bodyHeight,
    selectBodyTypes,
    selectedOptions,
    searchLanguages,
    englishProficiency,
    ethnicity,
    lookingFor,
    showMe,
    smoke,
    isChecked,
  } = useContext(AppContext);

  const onSave = async () => {
    try {
      const filterSettings = {
        ageRange,
        distanceRange,
        bodyHeight,
        selectBodyTypes,
        selectedOptions,
        searchLanguages,
        englishProficiency,
        ethnicity,
        lookingFor,
        showMe,
        smoke,
        isChecked,
      };
      await AsyncStorage.setItem('searchFilters', JSON.stringify(filterSettings));
      Alert.alert('Saved', 'Search settings saved. They will be applied on the home page.');
    } catch {
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const onReset = async () => {
    try {
      await AsyncStorage.removeItem('searchFilters');
      Alert.alert('Reset', 'Search settings reset to default');
    } catch {
      Alert.alert('Error', 'Failed to reset settings');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={onSave}>
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={onReset}>
        <Text style={styles.buttonText}>Reset</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
    marginBottom: 10,
    backgroundColor: colors.surfaceAlt,
  },
  button: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.md,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SaveResetButtons;
