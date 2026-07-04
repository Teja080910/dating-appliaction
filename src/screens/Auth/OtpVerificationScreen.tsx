import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { authApi } from '../../api/authApi';
import { AuthStorage } from '../../api/authStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OtpVerificationScreen = ({ navigation, route }: any) => {
  const { sessionId, mobile } = route.params || {};
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!otp.trim()) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }
    setLoading(true);
    try {
      const data = await authApi.verifyRegisterOtp({ sessionId, otp });
      if (data?.token) {
        if (data.userId) await AsyncStorage.setItem('user_id', data.userId);
        if (data.ID) await AsyncStorage.setItem('user_id_num', String(data.ID));
        await AsyncStorage.setItem('user_data', JSON.stringify(data));
        await AuthStorage.setToken(data.token);
        await AuthStorage.setUser(data);
        await AsyncStorage.setItem('isRegistered', 'true');
        navigation.replace('Privacy');
      } else {
        Alert.alert('Verified', 'Account verified. Please login.');
        navigation.replace('Login');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Invalid or expired OTP. Please try again.';
      Alert.alert('Verification Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await authApi.sendOtp({ mobile });
      Alert.alert('OTP Sent', 'Please check your mobile for the OTP.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#d13964', '#d94868']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#d13964" />
      <SafeAreaView style={styles.safe}>
        <Text style={styles.title}>Dating</Text>
        <Text style={styles.subtitle}>Verify your mobile number</Text>
        <Text style={styles.hint}>Enter the OTP sent to {mobile}</Text>

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Enter OTP"
            style={styles.input}
            placeholderTextColor="#999"
            keyboardType="number-pad"
            value={otp}
            onChangeText={setOtp}
            maxLength={6}
          />
        </View>

        <TouchableOpacity
          style={[styles.verifyButton, loading && { opacity: 0.7 }]}
          onPress={handleVerify}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.verifyText}>VERIFY OTP</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResend}
          disabled={loading}>
          <Text style={styles.resendText}>Resend OTP</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  hint: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 25,
    textAlign: 'center',
    opacity: 0.9,
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderRadius: 50,
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
    height: 50,
    width: '100%',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    color: '#000',
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 8,
    width: '100%',
  },
  verifyButton: {
    backgroundColor: '#fff',
    borderRadius: 50,
    paddingVertical: 15,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  verifyText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  resendButton: {
    paddingVertical: 10,
  },
  resendText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});

export default OtpVerificationScreen;
