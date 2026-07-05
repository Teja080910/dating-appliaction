import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  BackHandler,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import LinearGradient from 'react-native-linear-gradient';
import { profileApi } from '../../api/profileApi';
import { AuthStorage } from '../../api/authStorage';
import AppContext from '../../context/CreateGlobalStateContext';
import { mapGenderToDefaultOrientation } from '../../utils/genderMapping';
import OnboardingProgressBar from '../../components/onboarding/OnboardingProgressBar';
import { colors, radius, typography } from '../../constants/theme';

const genders = [
  { label: 'Male', value: 'male', icon: 'mars' },
  { label: 'Female', value: 'female', icon: 'venus' },
  { label: 'Other', value: 'other', icon: 'transgender-alt' },
];

const GenderOrientationScreen = ({ navigation }: any) => {
  const { setGender, setOrientation, profileCompletion, setProfileCompletion } = useContext(AppContext);
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCompletion = async () => {
      const uid = await AuthStorage.getUserIdStr();
      if (!uid) return;
      try {
        const pct = await profileApi.getProfileCompletion(uid);
        if (typeof pct === 'number') setProfileCompletion(pct);
      } catch {}
    };
    fetchCompletion();
  }, []);

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
      if (!userIdStr) {
        Alert.alert('Error', 'Session expired. Please login again.');
        return;
      }
      const orientation = mapGenderToDefaultOrientation(selectedGender);
      await profileApi.saveGenderOrientation({
        userId: userIdStr,
        gender: selectedGender,
        orientation,
      });
      setGender(selectedGender);
      setOrientation(orientation);
      navigation.navigate('DisplayName');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <OnboardingProgressBar percent={profileCompletion} />

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
              color={selectedGender === g.value ? colors.primary : colors.inkMuted}
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
        {selectedGender && !loading ? (
          <TouchableOpacity onPress={handleNext} activeOpacity={0.9}>
            <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.nextButton}>
              <Text style={styles.nextButtonText}>Next</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextButton, styles.disabledButton]}
            onPress={handleNext}
            disabled={!selectedGender || loading}>
            {loading ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={[styles.nextButtonText, { color: colors.inkFaint }]}>Next</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, paddingHorizontal: 24 },
  title: {
    marginTop: 30,
    ...typography.heading,
    textAlign: 'center',
    color: colors.ink,
  },
  genderRow: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderBtn: {
    width: '30%',
    padding: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  selectedOption: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  optionText: { textAlign: 'center', fontSize: 13, color: colors.inkMuted, marginTop: 6 },
  selectedOptionText: { color: colors.primary, fontWeight: '600' },
  bottomContainer: { flex: 1, justifyContent: 'flex-end', paddingBottom: 30 },
  nextButton: {
    paddingVertical: 14,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  disabledButton: { backgroundColor: colors.border },
  nextButtonText: { color: colors.surface, fontWeight: '600', fontSize: 16 },
});

export default GenderOrientationScreen;
