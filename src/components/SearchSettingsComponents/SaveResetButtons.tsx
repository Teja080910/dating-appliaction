import React, { useContext } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';
import { useNavigation } from '@react-navigation/native';

const SaveResetButtons = () => {
  const navigation = useNavigation();
  const {
    setAgeRange,
    setLocation,
    setDistanceRange,
    setBodyHeight,
    setSearchLanguages,
    setSelectedOptions,
    setSelectBodyTypes,
    setEnglishProficiency,
    setEthnicity,
    setLookingFor,
    setShowMe,
    setSmoke,
  } = useContext(AppContext);

  const onSave = () => {
    console.log('Settings saved');
    // For now, saving just means navigating back since states are already in Context
    navigation.goBack();
  };

  const onReset = () => {
    console.log('Settings reset');
    setAgeRange([18, 55]);
    setLocation('My current location');
    setDistanceRange(1100);
    setBodyHeight([120, 200]);
    setSearchLanguages([]);
    setSelectedOptions([]);
    setSelectBodyTypes([]);
    setEnglishProficiency([]);
    setEthnicity([]);
    setLookingFor([]);
    setShowMe(null);
    setSmoke([]);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={[styles.button, styles.resetButton]} onPress={onReset}>
        <Text style={styles.resetButtonText}>Reset</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={onSave}>
        <Text style={styles.saveButtonText}>Save</Text>
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
    paddingBottom: 8, // adds space above nav bar
    marginBottom: 10,  // moves the buttons up from bottom
    backgroundColor: '#f2f2f2',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 30,
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  saveButton: {
    backgroundColor: '#FF5A79', // Amara Theme color
  },
  resetButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SaveResetButtons;
