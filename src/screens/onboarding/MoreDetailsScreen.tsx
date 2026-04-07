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
import { Colors } from '../../utils/colors';

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

  // ✅ Safe multi-select (Languages)
  const toggleLanguage = (lang: string) => {
    if (selectedLanguages?.includes(lang)) {
      setSelectedLanguages(selectedLanguages.filter((l) => l !== lang));
    } else {
      setSelectedLanguages([...selectedLanguages, lang]);
    }
  };

  // ✅ Safe multi-select (Looking For)
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
      <LinearGradient colors={['#FF5A79', '#FF8E53']} style={styles.gradient}>
        <SafeAreaView style={{ flex: 1 }}>
          
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="chevron-left" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerText}>Personal Details</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.glassCard}>
              <Text style={styles.introText}>Let's refine your profile for better matches!</Text>

              {/* Height Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Height (cm)</Text>
                <View style={styles.heightContainer}>
                  <TouchableOpacity onPress={() => setHeight(Math.max(120, height - 1))} style={styles.stepBtn}>
                    <Icon name="minus" size={20} color="#FF5A79" />
                  </TouchableOpacity>
                  <Text style={styles.heightValue}>{height}</Text>
                  <TouchableOpacity onPress={() => setHeight(Math.min(220, height + 1))} style={styles.stepBtn}>
                    <Icon name="plus" size={20} color="#FF5A79" />
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
                <Text style={styles.nextButtonText}>NEXT STEP</Text>
                <Icon name="arrow-right" size={20} color="#fff" />
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
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  progressFill: {
    width: '30%',
    height: '100%',
    backgroundColor: Colors.pink,
  },
  backButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  headerText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 30,
    padding: 25,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  introText: { color: '#555', fontSize: 14, textAlign: 'center', marginBottom: 25, lineHeight: 20 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#333', marginBottom: 15 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  progressBarFill: { width: '60%', height: '100%', backgroundColor: '#FF5A79' },
  selectedChip: {
    backgroundColor: '#FF5A79',
    borderColor: '#FF5A79',
  },
  chipText: { color: '#666', fontSize: 13, fontWeight: '600' },
  selectedChipText: { color: '#fff' },
  heightContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#F8F9FA', 
    borderRadius: 15, 
    padding: 10 
  },
  heightValue: { fontSize: 24, fontWeight: '900', color: '#333', marginHorizontal: 30 },
  stepBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: '#fff', 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 3, 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 }
  },
  nextButton: {
    backgroundColor: '#FF5A79',
    height: 60,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#FF5A79',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  nextButtonText: { color: '#fff', fontWeight: '900', fontSize: 16, marginRight: 10, letterSpacing: 1 },
});

export default MoreDetailsScreen;
