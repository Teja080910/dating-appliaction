import React, { useContext, useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import AppContext from '../../context/CreateGlobalStateContext';
import { profileApi } from '../../api/profileApi';
import { AuthStorage } from '../../api/authStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BODY_TYPES,
  APPEARANCE_OPTIONS as APPEARANCES,
  LOOKING_FOR_OPTIONS as LOOKING_FOR,
  SMOKE_DRINK_OPTIONS as SMOKING_OPTIONS,
  SMOKE_DRINK_OPTIONS as DRINK_OPTIONS,
  LANGUAGES,
  ENGLISH_LEVELS as englishLevels,
} from '../../constants/profileOptions';
import OnboardingProgressBar from '../../components/onboarding/OnboardingProgressBar';
import LinearGradient from 'react-native-linear-gradient';
import { colors, radius, typography } from '../../constants/theme';

const ETHNICITIES = [
  'Asian', 'Black / African Descent', 'Latin / Hispanic', 'East Indian',
  'Middle Eastern', 'Mixed', 'Native American', 'Pacific Islander', 'White / Caucasian', 'Other',
];

const OnboardingMoreInfoScreen = ({ navigation }: any) => {
  const {
    selectedAppearance, setSelectedAppearance,
    selectedBodyType, setSelectedBodyType,
    selectedSmoking, setSelectedSmoking,
    selectedDrink, setSelectedDrink,
    englishSkillLevel, setEnglishSkillLevel,
    selectedEthinicity, setSelectedEthinicity,
    tempHeight, setTempHeight,
    selectedLanguages, setSelectedLanguages,
    selectedLookingFor, setSelectedLookingFor,
    profileCompletion, setProfileCompletion,
  } = useContext(AppContext);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // /profile/me never returns lookingFor (confirmed against the live
    // backend) — selectedLookingFor is carried entirely via shared context.
    const prefill = async () => {
      try {
        const userData = await AuthStorage.getUser();
        const uid = userData?.userId;
        if (uid) {
          const data = await profileApi.getMyProfile(uid);
          if (data.appearance) setSelectedAppearance(data.appearance);
          if (data.bodyType) setSelectedBodyType(data.bodyType);
          if (data.englishLevel) {
            const idx = englishLevels.indexOf(data.englishLevel);
            if (idx >= 0) setEnglishSkillLevel(idx);
          }
          if (data.ethnicity) setSelectedEthinicity(data.ethnicity);
          if (data.smoke) setSelectedSmoking(data.smoke);
          if (data.drink) setSelectedDrink(data.drink);
          if (data.height) setTempHeight(data.height);
          if (data.language) {
            setSelectedLanguages(data.language.split(',').map((s: string) => s.trim()).filter(Boolean));
          }
          const pct = await profileApi.getProfileCompletion(uid);
          if (typeof pct === 'number') setProfileCompletion(pct);
        }
      } catch {}
      setLoading(false);
    };
    prefill();
  }, []);

  const toggleArrayItem = (item: string, list: string[], setter: (v: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter((i) => i !== item));
    } else {
      setter([...list, item]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const userData = await AuthStorage.getUser();
      const uid = userData?.userId;
      if (uid) {
        await profileApi.saveAllProfile(uid, {
          language: selectedLanguages?.join(',') || undefined,
          appearance: selectedAppearance || undefined,
          bodyType: selectedBodyType || undefined,
          height: tempHeight || undefined,
          englishLevel: englishLevels[englishSkillLevel] || undefined,
          ethnicity: selectedEthinicity || undefined,
          lookingFor: selectedLookingFor?.join(',') || undefined,
          smoke: selectedSmoking || undefined,
          drink: selectedDrink || undefined,
        });
      }
      await AsyncStorage.setItem(AuthStorage.KEYS.ENTRY_HOME_SCREEN, 'true');
      navigation.replace('BottomTabs');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <OnboardingProgressBar percent={profileCompletion} />

        <Text style={styles.title}>More About You</Text>
        <Text style={styles.subtitle}>Help us find the best matches</Text>

        {/* Height */}
        <Text style={styles.label}>Height: {tempHeight} cm</Text>
        <Slider
          style={styles.slider}
          minimumValue={120}
          maximumValue={220}
          step={1}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.primary}
          value={tempHeight}
          onValueChange={setTempHeight}
        />

        {/* Body Type */}
        <Text style={styles.label}>Body Type</Text>
        <View style={styles.chipRow}>
          {BODY_TYPES.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.chip, selectedBodyType === item && styles.chipSelected]}
              onPress={() => setSelectedBodyType(selectedBodyType === item ? null : item)}
            >
              <Text style={[styles.chipText, selectedBodyType === item && styles.chipTextSelected]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Appearance */}
        <Text style={styles.label}>Appearance</Text>
        <View style={styles.chipRow}>
          {APPEARANCES.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.chip, selectedAppearance === item && styles.chipSelected]}
              onPress={() => setSelectedAppearance(selectedAppearance === item ? null : item)}
            >
              <Text style={[styles.chipText, selectedAppearance === item && styles.chipTextSelected]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Languages */}
        <Text style={styles.label}>Languages</Text>
        <View style={styles.chipRow}>
          {LANGUAGES.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.chip, selectedLanguages.includes(item) && styles.chipSelected]}
              onPress={() => toggleArrayItem(item, selectedLanguages, setSelectedLanguages)}
            >
              <Text style={[styles.chipText, selectedLanguages.includes(item) && styles.chipTextSelected]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* English Level */}
        <Text style={styles.label}>English: {englishLevels[englishSkillLevel]}</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={3}
          step={1}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.primary}
          value={englishSkillLevel}
          onSlidingComplete={setEnglishSkillLevel}
        />

        {/* Ethnicity */}
        <Text style={styles.label}>Ethnicity</Text>
        <View style={styles.chipRow}>
          {ETHNICITIES.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.chip, selectedEthinicity === item && styles.chipSelected]}
              onPress={() => setSelectedEthinicity(selectedEthinicity === item ? null : item)}
            >
              <Text style={[styles.chipText, selectedEthinicity === item && styles.chipTextSelected]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Smoke */}
        <Text style={styles.label}>Smoke</Text>
        <View style={styles.chipRow}>
          {SMOKING_OPTIONS.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.chip, selectedSmoking === item && styles.chipSelected]}
              onPress={() => setSelectedSmoking(selectedSmoking === item ? null : item)}
            >
              <Text style={[styles.chipText, selectedSmoking === item && styles.chipTextSelected]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Drink */}
        <Text style={styles.label}>Drink</Text>
        <View style={styles.chipRow}>
          {DRINK_OPTIONS.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.chip, selectedDrink === item && styles.chipSelected]}
              onPress={() => setSelectedDrink(selectedDrink === item ? null : item)}
            >
              <Text style={[styles.chipText, selectedDrink === item && styles.chipTextSelected]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Looking For */}
        <Text style={styles.label}>Looking For</Text>
        <View style={styles.chipRow}>
          {LOOKING_FOR.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.chip, selectedLookingFor.includes(item) && styles.chipSelected]}
              onPress={() => toggleArrayItem(item, selectedLookingFor, setSelectedLookingFor)}
            >
              <Text style={[styles.chipText, selectedLookingFor.includes(item) && styles.chipTextSelected]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.9}
          style={saving && { opacity: 0.7 }}
        >
          <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.nextButton}>
            {saving ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.nextButtonText}>Complete Profile</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scrollContent: { padding: 24, paddingBottom: 60 },
  title: { ...typography.title, color: colors.ink, marginBottom: 6 },
  subtitle: { fontSize: 16, color: colors.inkMuted, marginBottom: 24 },
  label: { fontSize: 15, fontWeight: '600', color: colors.ink, marginBottom: 10, marginTop: 20 },
  slider: { width: '100%', height: 40, marginBottom: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.surfaceAlt,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 14, color: colors.inkMuted },
  chipTextSelected: { color: colors.surface, fontWeight: '600' },
  nextButton: {
    paddingVertical: 16, borderRadius: radius.pill, alignItems: 'center', marginTop: 32,
  },
  nextButtonText: { color: colors.surface, fontWeight: '700', fontSize: 16 },
});

export default OnboardingMoreInfoScreen;
