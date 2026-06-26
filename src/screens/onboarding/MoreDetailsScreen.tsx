import React, { useContext, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppContext from '../../context/CreateGlobalStateContext';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Shadows } from '../../theme';

const MoreDetailsScreen = ({ navigation }: any) => {
  const {
    height = 165,
    setHeight,
    selectedAppearance,
    setSelectedAppearance,
    selectedBodyType,
    setSelectedBodyType,
    selectedEthinicity,
    setSelectedEthinicity,
    selectedLanguages = [],
    setSelectedLanguages,
    englishSkillLevel = 0,
    setEnglishSkillLevel,
    selectedSmoking,
    setSelectedSmoking,
    selectedDrinking,
    setSelectedDrinking,
    selectedLookingFor = [],
    setSelectedLookingFor,
  } = useContext(AppContext);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.setItem('onboardingStep', 'MoreDetails');
    }, []),
  );

  const OPTIONS = {
    appearance: ['Attractive', 'Average', 'Beautiful', 'Handsome', 'Stunning'],
    bodyType: ['Slim', 'Athletic', 'Average', 'Curvy', 'Strong'],
    ethnicity: ['Indian', 'Asian', 'Caucasian', 'Black', 'Hispanic', 'Middle Eastern', 'Mixed'],
    lookingFor: ['Relationship', 'Friendship', 'Casual', 'Something Serious', 'Marriage'],
    smoke_drink: ['Yes', 'No', 'Socially'],
    english: ['Beginner', 'Intermediate', 'Advanced', 'Native'],
  };

  const LANGUAGES = ['English', 'Hindi', 'Spanish', 'French', 'German', 'Chinese', 'Japanese'];

  const toggleLanguage = (lang: string) => {
    if (selectedLanguages?.includes(lang)) {
      setSelectedLanguages(selectedLanguages.filter((l) => l !== lang));
    } else {
      setSelectedLanguages([...selectedLanguages, lang]);
    }
  };

  const toggleLookingFor = (item: string) => {
    const current = Array.isArray(selectedLookingFor) ? selectedLookingFor : [];
    if (current.includes(item)) {
      setSelectedLookingFor(current.filter((i) => i !== item));
    } else {
      setSelectedLookingFor([...current, item]);
    }
  };

  const renderSection = (
    title: string,
    options: string[],
    current: any,
    setter: Function,
    isMulti = false
  ) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.chipContainer}>
        {options.map((opt) => {
          const isSelected = isMulti
            ? Array.isArray(current) && current.includes(opt)
            : current === opt;

          return (
            <TouchableOpacity
              key={opt}
              style={[styles.chip, isSelected && styles.selectedChip]}
              onPress={() => setter(opt)}
            >
              <Text style={[styles.chipText, isSelected && styles.selectedChipText]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={[Colors.background, Colors.surface]} style={styles.gradient}>
        <SafeAreaView style={{ flex: 1 }}>
          
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="chevron-left" size={28} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerText}>Personal Details</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.glassCard}>
              <Text style={styles.introText}>Let's refine your profile for better matches!</Text>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Height (cm)</Text>
                <View style={styles.heightContainer}>
                  <TouchableOpacity onPress={() => setHeight(Math.max(120, height - 1))} style={styles.stepBtn}>
                    <Icon name="minus" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.heightValue}>{height}</Text>
                  <TouchableOpacity onPress={() => setHeight(Math.min(220, height + 1))} style={styles.stepBtn}>
                    <Icon name="plus" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              {renderSection('Looking For', OPTIONS.lookingFor, selectedLookingFor, toggleLookingFor, true)}
              {renderSection('Appearance', OPTIONS.appearance, selectedAppearance, setSelectedAppearance)}
              {renderSection('Body Type', OPTIONS.bodyType, selectedBodyType, setSelectedBodyType)}
              {renderSection('Ethnicity', OPTIONS.ethnicity, selectedEthinicity, setSelectedEthinicity)}
              {renderSection('Languages', LANGUAGES, selectedLanguages, toggleLanguage, true)}
              
              {renderSection(
                'English Proficiency', 
                OPTIONS.english, 
                OPTIONS.english[englishSkillLevel] || 'Beginner', 
                (val: string) => setEnglishSkillLevel(OPTIONS.english.indexOf(val))
              )}
              
              {renderSection('Do you Smoke?', OPTIONS.smoke_drink, selectedSmoking, setSelectedSmoking)}
              {renderSection('Do you Drink?', OPTIONS.smoke_drink, selectedDrinking, setSelectedDrinking)}

              <TouchableOpacity 
                style={styles.nextButton}
                onPress={() => navigation.navigate('AboutProfile')}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.nextGradient}
                >
                  <Text style={styles.nextButtonText}>NEXT STEP</Text>
                  <Icon name="arrow-right" size={20} color={Colors.white} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.glass,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  headerText: { color: Colors.text, fontSize: 18, fontWeight: 'bold' },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl + 16 },
  glassCard: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radiusXxl,
    padding: Spacing.xl,
    marginTop: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    ...Shadows.xl,
  },
  introText: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 20 },
  section: { marginBottom: Spacing.xl },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.textSecondary, marginBottom: Spacing.md },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Spacing.radiusFull,
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    marginBottom: Spacing.sm,
  },
  selectedChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  selectedChipText: { color: Colors.white },
  heightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: Spacing.radiusLg,
    padding: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  heightValue: { fontSize: 24, fontWeight: '900', color: Colors.text, marginHorizontal: Spacing.xl },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.glass,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  nextButton: {
    borderRadius: Spacing.radiusFull,
    overflow: 'hidden',
    marginTop: Spacing.sm + 2,
    ...Shadows.md,
  },
  nextGradient: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: { color: Colors.white, fontWeight: '900', fontSize: 16, marginRight: Spacing.sm + 2, letterSpacing: 1 },
});

export default MoreDetailsScreen;
