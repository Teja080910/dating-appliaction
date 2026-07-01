import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { profileApi } from '../../api/profileApi';
import { AuthStorage } from '../../api/authStorage';

const genders = [
  { label: 'Male', value: 'male', icon: 'mars' },
  { label: 'Female', value: 'female', icon: 'venus' },
  { label: 'Other', value: 'other', icon: 'transgender-alt' },
];

const GenderOrientationScreen = ({ navigation }: any) => {
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.replace('Privacy');
        return true;
      };
      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backHandler.remove();
    }, [navigation]),
  );

  const handleNext = async () => {
    if (!selectedGender) return;
    setLoading(true);
    try {
      const userIdStr = await AuthStorage.getUserIdStr();
      if (userIdStr) {
        try {
          await profileApi.saveGenderOrientation({
            userId: userIdStr,
            gender: selectedGender,
            orientation: selectedGender === 'male' ? 'straight_man' : selectedGender === 'female' ? 'straight_woman' : 'lgbtqia',
          });
        } catch {}
      }
    } catch {}
    setLoading(false);
    navigation.navigate('DisplayName');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarFill} />
      </View>

      <Text style={styles.title}>What's your gender?</Text>

      <View style={styles.genderRow}>
        {genders.map((g) => (
          <TouchableOpacity
            key={g.value}
            style={[
              styles.genderBtn,
              selectedGender === g.value && styles.selectedOption,
            ]}
            onPress={() => setSelectedGender(g.value)}>
            <Icon
              name={g.icon}
              size={24}
              color={selectedGender === g.value ? '#E94057' : '#555'}
            />
            <Text
              style={[
                styles.optionText,
                selectedGender === g.value && styles.selectedOptionText,
              ]}>
              {g.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.nextButton, (!selectedGender || loading) && styles.disabledButton]}
          onPress={handleNext}
          disabled={!selectedGender || loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextButtonText}>Next</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 24 },
  progressBarContainer: {
    height: 5,
    backgroundColor: '#e0e0e0',
    marginTop: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '20%',
    height: '100%',
    backgroundColor: '#E94057',
  },
  title: {
    marginTop: 30,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
  },
  genderRow: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderBtn: {
    width: '30%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  selectedOption: { borderColor: '#E94057', backgroundColor: '#fff0f3' },
  optionText: { textAlign: 'center', fontSize: 13, color: '#555', marginTop: 6 },
  selectedOptionText: { color: '#E94057', fontWeight: '600' },
  bottomContainer: { flex: 1, justifyContent: 'flex-end', paddingBottom: 30 },
  nextButton: {
    backgroundColor: '#E94057',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  disabledButton: { backgroundColor: '#ddd' },
  nextButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});

export default GenderOrientationScreen;
