import React, { useCallback, useContext, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DatePicker from 'react-native-date-picker';
import Icon from 'react-native-vector-icons/FontAwesome5';
import AppContext from '../../context/CreateGlobalStateContext';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAlert } from '../../components/AlertModal';
import { Colors, Spacing } from '../../theme';

const DOBScreen = ({ navigation }: any) => {
  const { date, setDate } = useContext(AppContext);
  const { alert, AlertComponent } = useAlert();

  // ✅ Safe default date
  const safeDate = date ? new Date(date) : new Date('2000-01-01');

  // ✅ Age calculation
  const getAge = (dob: Date) => {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const currentAge = getAge(safeDate);

  const handleNext = () => {
    if (currentAge < 18) {
      alert('Age Restriction', 'You must be at least 18 years old to use AMARA.');
      return;
    }
    navigation.navigate('UploadImage');
  };

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.setItem('onboardingStep', 'DOB');
      const onBackPress = () => {
        navigation.replace('DisplayName');
        return true;
      };
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );
      return () => backHandler.remove();
    }, [navigation])
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarFill} />
      </View>

      {/* Title */}
      <Text style={styles.title}>When are you born?</Text>

      {/* Inline Date Picker Wheel */}
      <View style={styles.datePickerWrapper}>
        <DatePicker
          date={safeDate}
          onDateChange={setDate}
          mode="date"
          theme="dark"
          locale="en"
          maximumDate={new Date()}
        />
      </View>

      {/* Bottom Info */}
      <View style={styles.bottomContainer}>
        <View style={styles.infoContainer}>
          <Icon name="info-circle" size={14} color={Colors.textMuted} />
          <Text style={styles.infoText}>
            Did you know that you have 100% privacy at AMARA? Only invited users can see your profile.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.nextButton, currentAge < 18 && styles.disabledButton]}
          onPress={handleNext}
          disabled={currentAge < 18}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
      {AlertComponent}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 24 },
  progressBarContainer: { height: 5, backgroundColor: Colors.surfaceLighter, marginTop: 10, borderRadius: 10, overflow: 'hidden' },
  progressBarFill: { width: '60%', height: '100%', backgroundColor: Colors.primary },
  title: { marginTop: 30, fontSize: 26, fontWeight: '700', textAlign: 'center', color: Colors.text },
  datePickerWrapper: {
    marginTop: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomContainer: { marginTop: 'auto', paddingBottom: 30 },
  infoContainer: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 20 },
  infoText: { fontSize: 12, color: Colors.textMuted, flex: 1 },
  nextButton: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 999, alignItems: 'center' },
  disabledButton: { opacity: 0.5 },
  nextButtonText: { color: Colors.white, fontWeight: 'bold', fontSize: 18 },
});

export default DOBScreen;
