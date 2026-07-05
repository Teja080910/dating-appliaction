import React, { useCallback, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  BackHandler,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import AppContext from '../../context/CreateGlobalStateContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthStorage } from '../../api/authStorage';
import { profileApi } from '../../api/profileApi';
import OnboardingProgressBar from '../../components/onboarding/OnboardingProgressBar';
import { colors, radius, typography } from '../../constants/theme';

const DisplayNameScreen = ({ navigation }: any) => {
  const { name, setName, profileCompletion, setProfileCompletion } = useContext(AppContext);

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
        AsyncStorage.getItem('isLoggedIn').then((isLoggedIn) => {
          if (isLoggedIn === 'true') {
            navigation.replace('Privacy');
          } else {
            navigation.replace('GenderOrientation');
          }
        });
        return true;
      };
      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backHandler.remove();
    }, [navigation])
  );

  const handleDisplayName = async () => {
    const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
    isLoggedIn === 'true'
      ? navigation.replace('UploadImage')
      : navigation.replace('DOB');
  };

  return (
    <SafeAreaView style={styles.container}>
      <OnboardingProgressBar percent={profileCompletion} />

      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Dating!</Text>
        <Text style={styles.subtitle}>Please choose a display name!</Text>

        <TextInput
          style={styles.input}
          placeholder="Write your nickname here"
          placeholderTextColor={colors.inkFaint}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.helperText}>
          This name will appear on your profile.
        </Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            You can use your real name or a nickname
          </Text>
        </View>

        {name.trim() ? (
          <TouchableOpacity onPress={handleDisplayName} activeOpacity={0.9}>
            <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.nextButton}>
              <Text style={[styles.nextButtonText, styles.nextButtonTextActive]}>Next</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.nextButton} disabled>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
  },
  title: {
    ...typography.heading,
    marginBottom: 8,
    color: colors.ink,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 30,
    color: colors.inkMuted,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.surfaceAlt,
  },
  helperText: {
    color: colors.inkFaint,
    marginTop: 6,
    fontSize: 14,
  },
  footer: {
    marginBottom: 30,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIcon: {
    fontSize: 16,
    color: colors.inkFaint,
    marginRight: 6,
  },
  infoText: {
    color: colors.inkFaint,
    fontSize: 14,
  },
  nextButton: {
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 15,
    alignItems: 'center',
  },
  nextButtonText: {
    color: colors.inkFaint,
    fontWeight: '600',
    fontSize: 16,
  },
  nextButtonTextActive: {
    color: colors.surface,
  },
});

export default DisplayNameScreen;
