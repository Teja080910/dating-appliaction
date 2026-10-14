import React, { useState, useContext, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AppContext from '../../context/CreateGlobalStateContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../theme';
import { useAlert } from '../../components/AlertModal';
import { t, useTranslation } from '../../i18n';

const DisplayNameScreen = ({ navigation }: any) => {
  useTranslation();
  const { name, setName, displayName, setDisplayName, setDate } = useContext(AppContext);
  const { alert, AlertComponent } = useAlert();
  const { isDark } = useTheme();

  const [nickname, setNickname] = useState(displayName || name || '');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  const dayRef = useRef<TextInput>(null);
  const monthRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.setItem('onboardingStep', 'DisplayName');

      const onBackPress = () => {
        if (navigation.canGoBack()) navigation.goBack();
        else navigation.replace('GenderOrientation');
        return true;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backHandler.remove();
    }, [navigation]),
  );

  const calculateAge = (d: number, m: number, y: number) => {
    const today = new Date();
    const birthDate = new Date(y, m - 1, d);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleNext = async () => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      alert('Name Required', 'Please enter your nickname or first name.');
      return;
    }

    const dNum = parseInt(day, 10);
    const mNum = parseInt(month, 10);
    const yNum = parseInt(year, 10);

    if (
      !day ||
      !month ||
      !year ||
      isNaN(dNum) ||
      isNaN(mNum) ||
      isNaN(yNum) ||
      dNum < 1 ||
      dNum > 31 ||
      mNum < 1 ||
      mNum > 12 ||
      yNum < 1920 ||
      yNum > new Date().getFullYear()
    ) {
      alert('Valid Birthday Required', 'Please enter a valid birthday in DD / MM / YYYY format.');
      return;
    }

    const age = calculateAge(dNum, mNum, yNum);
    if (age < 18) {
      alert('Age Restriction', t('onboarding.dobscreen.you_must_be_at_least_18_years_old_to_register'));
      return;
    }

    const dobString = `${yNum}-${String(mNum).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
    const dobDate = new Date(yNum, mNum - 1, dNum);

    await AsyncStorage.setItem('name', trimmed);
    await AsyncStorage.setItem('displayName', trimmed);
    await AsyncStorage.setItem('userDob', dobString);

    if (setName) setName(trimmed);
    if (setDisplayName) setDisplayName(trimmed);
    if (setDate) setDate(dobDate);

    navigation.navigate('SelfieVerification');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0F0D1A' : '#FFFFFF' }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#0F0D1A' : '#FFFFFF'}
      />
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Header: Back Button & 8-Segment Progress Bar */}
          <View style={styles.topHeaderRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => {
                if (navigation.canGoBack()) navigation.goBack();
                else navigation.replace('GenderOrientation');
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Icon name="chevron-left" size={32} color={isDark ? '#FFFFFF' : '#111827'} />
            </TouchableOpacity>

            <View style={styles.progressBarWrapper}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((stepNum) => (
                <View
                  key={stepNum}
                  style={[
                    styles.progressDash,
                    stepNum <= 2
                      ? styles.progressDashActive
                      : { backgroundColor: isDark ? '#2D2950' : '#E5E7EB' },
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Section 1: What's your name? */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>{t('onboarding.displaynamescreen.whats_your_name')}</Text>
            <View
              style={[
                styles.nameInputCard,
                { backgroundColor: isDark ? '#1F1B2E' : '#F3F4F6' },
              ]}
            >
              <TextInput
                style={[styles.nameInput, { color: isDark ? '#FFFFFF' : '#111827' }]}
                placeholder={t('profile.displayname.nickname_first_name')}
                placeholderTextColor="#9CA3AF"
                value={nickname}
                onChangeText={setNickname}
              />
            </View>
          </View>

          {/* Section 2: Your birthday? */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>{t('onboarding.dobscreen.your_birthday')}</Text>
            <Text style={[styles.sectionSubtitle, { color: isDark ? '#9CA3AF' : '#4B5563' }]}>{t('onboarding.dobscreen.you_must_be_at_least_18_years_old_to_register')}</Text>

            {/* 3 Date Input Boxes separated by slashes */}
            <View style={styles.dateRow}>
              {/* DD Box */}
              <View
                style={[
                  styles.dateBox,
                  { backgroundColor: isDark ? '#1F1B2E' : '#F3F4F6' },
                ]}
              >
                <TextInput
                  ref={dayRef}
                  style={[styles.dateInput, { color: isDark ? '#FFFFFF' : '#111827' }]}
                  placeholder="DD"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  maxLength={2}
                  value={day}
                  onChangeText={(val) => {
                    setDay(val);
                    if (val.length === 2) {
                      monthRef.current?.focus();
                    }
                  }}
                />
              </View>

              <Text style={styles.dateSlash}>/</Text>

              {/* MM Box */}
              <View
                style={[
                  styles.dateBox,
                  { backgroundColor: isDark ? '#1F1B2E' : '#F3F4F6' },
                ]}
              >
                <TextInput
                  ref={monthRef}
                  style={[styles.dateInput, { color: isDark ? '#FFFFFF' : '#111827' }]}
                  placeholder="MM"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  maxLength={2}
                  value={month}
                  onChangeText={(val) => {
                    setMonth(val);
                    if (val.length === 2) {
                      yearRef.current?.focus();
                    }
                  }}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === 'Backspace' && !month) {
                      dayRef.current?.focus();
                    }
                  }}
                />
              </View>

              <Text style={styles.dateSlash}>/</Text>

              {/* YYYY Box */}
              <View
                style={[
                  styles.yearBox,
                  { backgroundColor: isDark ? '#1F1B2E' : '#F3F4F6' },
                ]}
              >
                <TextInput
                  ref={yearRef}
                  style={[styles.dateInput, { color: isDark ? '#FFFFFF' : '#111827' }]}
                  placeholder="YYYY"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  maxLength={4}
                  value={year}
                  onChangeText={setYear}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === 'Backspace' && !year) {
                      monthRef.current?.focus();
                    }
                  }}
                />
              </View>
            </View>
          </View>

          {/* Spacer to push Next button to bottom */}
          <View style={styles.spacer} />

          {/* Next Button */}
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
            <Text style={styles.nextBtnText}>{t('onboarding.aboutprofilescreen.next')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      {AlertComponent}
    </SafeAreaView>
  );
};

export default DisplayNameScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'android' ? 12 : 6,
    paddingBottom: 24,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backBtn: {
    marginRight: 12,
    marginLeft: -6,
  },
  progressBarWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
    gap: 6,
  },
  progressDash: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressDashActive: {
    backgroundColor: '#7C3AED',
  },
  sectionContainer: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14.5,
    marginBottom: 18,
    lineHeight: 20,
  },
  nameInputCard: {
    borderRadius: 10,
    height: 52,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  nameInput: {
    fontSize: 16,
    paddingVertical: 0,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateBox: {
    width: 68,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearBox: {
    width: 88,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateInput: {
    width: '100%',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 0,
  },
  dateSlash: {
    fontSize: 20,
    color: '#9CA3AF',
    marginHorizontal: 10,
    fontWeight: '500',
  },
  spacer: {
    flex: 1,
    minHeight: 40,
  },
  nextBtn: {
    backgroundColor: '#7C3AED',
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  nextBtnText: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
