import { StyleSheet, Text, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import React, { useContext, useState } from 'react';
import AppContext from '../../context/CreateGlobalStateContext';
import { profileApi } from '../../api/profileApi';
import { AuthStorage } from '../../api/authStorage';

const SaveButton = () => {
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
  } = useContext(AppContext);

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const userIdStr = await AuthStorage.getUserIdStr();
      if (!userIdStr) return;

      await profileApi.updateDetails({
        userId: userIdStr,
        language: selectedLanguages?.join(',') || '',
        bodyType: selectedBodyType || '',
        appearance: selectedAppearance || '',
        height: tempHeight || 165,
      });

      const preferences: any = { userId: userIdStr };
      if (selectedLookingFor?.length) preferences.lookingFor = selectedLookingFor.join(',');
      if (selectedSmoking) preferences.smoke = selectedSmoking;
      await profileApi.updatePreferences(preferences);

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
