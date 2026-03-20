import {StyleSheet, Text, TouchableOpacity, View, Alert} from 'react-native';
import React, { useContext } from 'react';
import AppContext from '../../context/CreateGlobalStateContext';
import { useNavigation } from '@react-navigation/native';

const SaveButton = () => {
  const navigation = useNavigation();
  const { 
    selectedAppearance, 
    selectedBodyType, 
    selectedSmoking, 
    englishSkillLevel, 
    selectedEthinicity, 
    tempHeight, 
    selectedKidCount, 
    selectedLanguages, 
    selectedLookingFor,
    setProfilePreferences 
  } = useContext(AppContext);

  const handleSave = () => {
    // validation check
    if (!selectedAppearance || !selectedBodyType || !selectedEthinicity || 
        !selectedSmoking || !selectedKidCount || selectedLanguages.length === 0 || 
        selectedLookingFor.length === 0) {
      Alert.alert(
        "Incomplete Profile", 
        "Please fill in all the details before saving.",
        [{ text: "OK" }]
      );
      return;
    }

    console.log('Saving profile preferences...');
    
    setProfilePreferences({
      appearance: selectedAppearance,
      bodyType: selectedBodyType,
      smoking: selectedSmoking,
      englishSkill: englishSkillLevel,
      ethnicity: selectedEthinicity,
      height: tempHeight,
      kidCount: selectedKidCount,
      languages: selectedLanguages,
      lookingFor: selectedLookingFor,
    });

    Alert.alert(
      "Success",
      "Your profile information has been saved successfully!",
      [{ text: "OK", onPress: () => navigation.goBack() }]
    );
  };

  return (
    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
      <Text style={styles.saveButtonText}>Save Details</Text>
    </TouchableOpacity>
  );
};

export default SaveButton;

const styles = StyleSheet.create({
  saveButton: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: '#FF5A79', // Amara Theme color
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    // Add shadow
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
