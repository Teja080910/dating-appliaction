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
import DatePicker from 'react-native-date-picker';
import Icon from 'react-native-vector-icons/FontAwesome5';
import LinearGradient from 'react-native-linear-gradient';
import AppContext from '../../context/CreateGlobalStateContext';
import { useFocusEffect } from '@react-navigation/native';
import { profileApi } from '../../api/profileApi';
import { AuthStorage } from '../../api/authStorage';
import { calculateAge } from '../../utils/dateUtils';
import OnboardingProgressBar from '../../components/onboarding/OnboardingProgressBar';
import { colors, radius, typography } from '../../constants/theme';

const DOBScreen = ({ navigation }: any) => {
  const { date, setDate, profileCompletion, setProfileCompletion } = useContext(AppContext);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const handleNext = async () => {
    setSaving(true);
    try {
      const userIdStr = await AuthStorage.getUserIdStr();
      if (!userIdStr) {
        Alert.alert('Error', 'Session expired. Please login again.');
        return;
      }
      const dobStr = date.toISOString().split('T')[0];
      const age = calculateAge(date);
      await profileApi.saveAllProfile(userIdStr, {
        dob: dobStr,
        age,
      });
      navigation.navigate('UploadImage');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.replace('DisplayName');
        return true;
      };
      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backHandler.remove();
    }, [navigation]),
  );

  const formattedDate = date.toLocaleDateString('en-GB');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      <OnboardingProgressBar percent={profileCompletion} />

      <Text style={styles.title}>When are you born?</Text>

      <TouchableOpacity style={styles.dateDisplay} onPress={() => setOpen(true)}>
        <Text style={styles.dateText}>{formattedDate}</Text>
      </TouchableOpacity>

      <DatePicker
        modal
        open={open}
        date={date}
        mode="date"
        onConfirm={(selectedDate) => {
          setOpen(false);
          setDate(selectedDate);
        }}
        onCancel={() => setOpen(false)}
      />

      <View style={styles.bottomContainer}>
        <View style={styles.infoContainer}>
          <Icon name="info-circle" size={14} color={colors.inkFaint} style={{ marginTop: 2 }} />
          <Text style={styles.infoText}>
            Did you know that you have 100% privacy at Dating? Only the people
            who you have sent an invitation to will be able to view your profile!
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleNext}
          disabled={saving}
          activeOpacity={0.9}
          style={saving && { opacity: 0.7 }}>
          <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.nextButton}>
            {saving ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.nextButtonText}>Next</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, paddingHorizontal: 24 },
  title: {
    marginTop: 30,
    ...typography.title,
    textAlign: 'center',
    color: colors.ink,
  },
  dateDisplay: {
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  dateText: { fontSize: 16, color: colors.ink },
  bottomContainer: { marginTop: 'auto', paddingBottom: 30 },
  infoContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  infoText: { fontSize: 12, color: colors.inkFaint, flex: 1 },
  nextButton: {
    paddingVertical: 16,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  nextButtonText: { color: colors.surface, fontWeight: '600', fontSize: 16 },
});

export default DOBScreen;
