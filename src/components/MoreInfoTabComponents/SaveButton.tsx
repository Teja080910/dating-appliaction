import { StyleSheet, Text, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import React, { useContext, useState } from 'react';
import AppContext from '../../context/CreateGlobalStateContext';
import { profileApi } from '../../api/profileApi';
import { AuthStorage } from '../../api/authStorage';
import { calculateAge } from '../../utils/dateUtils';
import { ENGLISH_LEVELS as englishLevels } from '../../constants/profileOptions';
import { colors, radius, shadow } from '../../constants/theme';

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
      const userData = await AuthStorage.getUser();
      const userId = userData?.userId;
      if (!userId) {
        Alert.alert('Error', 'Session expired. Please login again.');
        return;
      }

      const dobStr = date ? date.toISOString().split('T')[0] : undefined;
      const age = date ? calculateAge(date) : undefined;

      const dto: any = {};
      if (age) dto.age = age;
      if (dobStr) dto.dob = dobStr;
      if (selectedLanguages?.length) dto.language = selectedLanguages.join(',');
      if (selectedAppearance) dto.appearance = selectedAppearance;
      if (selectedBodyType) dto.bodyType = selectedBodyType;
      if (tempHeight) dto.height = tempHeight;
      if (englishLevels[englishSkillLevel]) dto.englishLevel = englishLevels[englishSkillLevel];
      if (selectedEthinicity) dto.ethnicity = selectedEthinicity;
      if (selectedLookingFor?.length) dto.lookingFor = selectedLookingFor.join(',');
      if (selectedSmoking) dto.smoke = selectedSmoking;
      if (selectedDrink) dto.drink = selectedDrink;

      await profileApi.saveAllProfile(userId, dto);

      Alert.alert('Success', 'Profile updated successfully');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save profile';
      Alert.alert('Error', msg);
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
          <ActivityIndicator color={colors.surface} />
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
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: 'center',
    ...shadow.card,
  },
  saveButtonText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SaveButton;
