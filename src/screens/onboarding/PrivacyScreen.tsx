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
import { profileApi } from '../../api/profileApi';
import { authApi } from '../../api/authApi';
import { AuthStorage } from '../../api/authStorage';

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
        } catch {}
      }
      await AsyncStorage.setItem('acceptedTerms', 'true');
      await AsyncStorage.setItem('GenderOrientation', 'true');

      navigation.replace('GenderOrientation');
    } catch {
      // Even if API fails, allow navigation
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
        <View style={styles.progress} />
      </View>

      <Text style={styles.header}>We care about your privacy.</Text>

      <View style={styles.checkRow}>
        <Icon name="check-circle" size={24} color="#e14c61" />
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
        style={[styles.acceptBtn, loading && { opacity: 0.7 }]}
        onPress={handleAccept}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.acceptBtnText}>Accept terms of use</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 25,
    justifyContent: 'center',
  },
  progressBarWrapper: {
    height: 5,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 25,
  },
  progress: {
    height: 5,
    width: '10%',
    backgroundColor: '#e14c61',
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 25,
    color: '#000',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 8,
  },
  agreeText: {
    flex: 1,
    color: '#333',
    fontSize: 14,
  },
  linkBtn: {
    borderWidth: 1,
    borderColor: '#000',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 30,
    marginVertical: 8,
  },
  linkText: {
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    marginTop: 25,
    fontSize: 13,
    color: '#444',
  },
  acceptBtn: {
    backgroundColor: '#e14c61',
    borderRadius: 30,
    paddingVertical: 14,
    marginTop: 30,
    alignItems: 'center',
  },
  acceptBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default PrivacyScreen;
