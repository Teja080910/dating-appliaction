import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
  Linking,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { profileApi } from '../../api/profileApi';
import { authApi } from '../../api/authApi';
import { AuthStorage } from '../../api/authStorage';
import { colors, radius, typography } from '../../constants/theme';

const PrivacyScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true,
    );
    return () => backHandler.remove();
  }, []);

  const handleAccept = async () => {
    setLoading(true);
    try {
      const userId = await AuthStorage.getUserId();
      if (userId) {
        try {
          await profileApi.acceptTerms(userId);
          await authApi.activateAccount(userId);
        } catch (err) {
          // Intentionally don't block onboarding on this failure, but log
          // it — otherwise client/server acceptance state can silently
          // diverge with no trace.
          console.warn('PrivacyScreen: acceptTerms/activateAccount failed', err);
        }
      }
      await AsyncStorage.setItem('acceptedTerms', 'true');
      await AsyncStorage.setItem('GenderOrientation', 'true');

      navigation.replace('GenderOrientation');
    } catch (err) {
      // Even if API fails, allow navigation
      console.warn('PrivacyScreen: handleAccept failed', err);
      await AsyncStorage.setItem('acceptedTerms', 'true');
      await AsyncStorage.setItem('GenderOrientation', 'true');

      navigation.replace('GenderOrientation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressBarWrapper}>
        <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.progress} />
      </View>

      <Text style={styles.header}>We care about your privacy.</Text>

      <View style={styles.checkRow}>
        <Icon name="check-circle" size={24} color={colors.primary} />
        <Text style={styles.agreeText}>
          By clicking "Accept terms of use" you accept our terms of use and privacy policy.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.linkBtn}
        onPress={() => Linking.openURL('https://example.com/eula')}>
        <Text style={styles.linkText}>📄 End user license agreement</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkBtn}
        onPress={() => Linking.openURL('https://example.com/privacy')}>
        <Text style={styles.linkText}>📄 Privacy Policy</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>
        We store your primary account information such as location, the personal information you specified and usage data only for the purpose of improving our app development and suggesting our users the best possible matching partners.
      </Text>

      <TouchableOpacity
        onPress={handleAccept}
        disabled={loading}
        activeOpacity={0.9}
        style={loading && { opacity: 0.7 }}>
        <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.acceptBtn}>
          {loading ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.acceptBtnText}>Accept terms of use</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 25,
    justifyContent: 'center',
  },
  progressBarWrapper: {
    height: 5,
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginBottom: 25,
  },
  progress: {
    height: 5,
    width: '10%',
    borderRadius: radius.pill,
  },
  header: {
    ...typography.title,
    marginBottom: 25,
    color: colors.ink,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 8,
  },
  agreeText: {
    flex: 1,
    color: colors.inkMuted,
    fontSize: 14,
  },
  linkBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    marginVertical: 8,
  },
  linkText: {
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
    color: colors.ink,
  },
  footer: {
    marginTop: 25,
    fontSize: 13,
    color: colors.inkMuted,
  },
  acceptBtn: {
    borderRadius: radius.pill,
    paddingVertical: 14,
    marginTop: 30,
    alignItems: 'center',
  },
  acceptBtnText: {
    color: colors.surface,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default PrivacyScreen;
