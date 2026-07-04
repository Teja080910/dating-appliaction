import { StyleSheet, Text, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import React, { useContext, useState } from 'react';
import AppContext from '../../context/CreateGlobalStateContext';
import { profileApi } from '../../api/profileApi';
import { AuthStorage } from '../../api/authStorage';

const englishLevels = ['Bad', 'Medium', 'Good', 'Very Good'];

const SaveButton = () => {
  const {
    selectedAppearance,
    selectedBodyType,
    selectedSmoking,
    selectedDrink,
    englishSkillLevel,
    selectedEthinicity,
    tempHeight,
    selectedLanguages,
    selectedLookingFor,
    date,
  } = useContext(AppContext);

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const userIdStr = await AuthStorage.getUserIdStr();
      if (!userIdStr) return;

      const dobStr = date ? date.toISOString().split('T')[0] : undefined;
      const age = date ? new Date().getFullYear() - date.getFullYear() : undefined;

      await profileApi.updateBasic({
        userId: userIdStr,
        age,
      });

      await profileApi.updateDetails({
        userId: userIdStr,
        language: selectedLanguages?.join(',') || '',
        bodyType: selectedBodyType || '',
        appearance: selectedAppearance || '',
        height: tempHeight || 165,
        ethnicity: selectedEthinicity || '',
        englishLevel: englishLevels[englishSkillLevel] || '',
      });

      await profileApi.updatePreferences({
        userId: userIdStr,
        lookingFor: selectedLookingFor?.join(',') || '',
        smoke: selectedSmoking || '',
        drink: selectedDrink || '',
      });

      Alert.alert('Success', 'Profile updated successfully');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View>
      <TouchableOpacity
        style={[styles.saveButton, saving && { opacity: 0.7 }]}
        onPress={handleSave}
        disabled={saving}>
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

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

export default SaveButton;
