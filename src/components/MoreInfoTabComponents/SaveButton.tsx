import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React, { useContext } from 'react';
import AppContext from '../../context/CreateGlobalStateContext';

const SaveButton = () => {

  const { selectedAppearance, selectedBodyType, selectedSmoking, englishSkillLevel, selectedEthinicity, tempHeight, selectedKidCount, selectedLanguages, selectedLookingFor, localValue } = useContext(AppContext);

  const { setProfilePreferences } = useContext(AppContext);
  const handleSave = () => {
    setProfilePreferences({
      appearance: selectedAppearance,
      bodyType: selectedBodyType,
      smoking: selectedSmoking,
      englishSkill: localValue,
      ethnicity: selectedEthinicity,
      height: tempHeight,
      kidCount: selectedKidCount,
      languages: selectedLanguages,
      lookingFor: selectedLookingFor,
    });
  
  }
  return (
    <View>
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SaveButton;

const styles = StyleSheet.create({
  saveButton: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: '#D9534F',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
