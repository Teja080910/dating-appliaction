import React, { useContext, useState } from 'react';
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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppContext from '../../context/CreateGlobalStateContext';
import { useLoginMutation } from '../../api/useLoginMutation';
import { authApi } from '../../api/authApi';
import { AuthStorage } from '../../api/authStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation, route }: any) => {
  const { password, setPassword, email, setEmail } = useContext(AppContext);
  const { mutate: login, isPending } = useLoginMutation();

  const pendingOtpUserId = route?.params?.pendingOtpUserId;
  const pendingOtpMobile = route?.params?.pendingOtpMobile;

  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both mobile number and password');
      return;
    }
    login({ mobile: email, password });
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }
    setOtpLoading(true);
    try {
      const mobile = pendingOtpMobile || email;
      const userId = pendingOtpUserId || '';
      let data: any;
      let verified = false;

      try {
        data = await authApi.verifyRegisterOtp({ mobile, otp });
        verified = true;
      } catch {
        try {
          data = await authApi.verifyRegisterOtp({ userId, otp });
          verified = true;
        } catch {
          try {
            data = await authApi.verifyOtp({
              userId: parseInt(userId, 10) || 0,
              mobile,
              otp,
            });
            verified = true;
          } catch {}
        }
      }

      if (verified) {
        if (data?.token) {
          await AuthStorage.setToken(data.token);
          await AuthStorage.setUser(data);
          await AsyncStorage.setItem('isRegistered', 'true');
          navigation.replace('Privacy');
        } else {
          const activateId = parseInt(userId, 10) || 0;
          if (activateId > 0) {
            try { await authApi.activateAccount(activateId); } catch {}
          }
          try {
            const loginResult = await authApi.login({ mobile, password });
            if (loginResult?.token) {
              await AuthStorage.setToken(loginResult.token);
              await AuthStorage.setUser(loginResult);
              await AsyncStorage.setItem('isRegistered', 'true');
              await AsyncStorage.setItem('entryHomeScreen', 'true');
              navigation.replace('BottomTabs');
              return;
            }
          } catch {}
          navigation.replace('Privacy');
        }
      } else {
        Alert.alert('Verification Failed', 'Invalid or expired OTP. Please try again.');
      }
    } catch {
      Alert.alert('Verification Failed', 'Invalid or expired OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpLoading(true);
    try {
      await authApi.sendOtp({ mobile: pendingOtpMobile || email });
      Alert.alert('OTP Sent', 'Please check your mobile for the OTP.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  if (pendingOtpUserId) {
    return (
      <LinearGradient colors={['#d13964', '#d94868']} style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#d13964" />
        <SafeAreaView style={styles.safe}>
          <Text style={styles.title}>Dating</Text>
          <Text style={styles.subtitle}>Verify your mobile number</Text>
          <Text style={styles.otpHint}>Enter the OTP sent to {pendingOtpMobile || 'your mobile'}</Text>

          <View style={styles.inputContainer}>
            <Icon name="key-variant" size={20} color="#d13964" style={styles.icon} />
            <TextInput
              placeholder="Enter OTP"
              style={styles.input}
              placeholderTextColor="#333"
              keyboardType="number-pad"
              value={otp}
              onChangeText={setOtp}
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, otpLoading && { opacity: 0.7 }]}
            onPress={handleVerifyOtp}
            disabled={otpLoading}>
            {otpLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.loginText}>VERIFY OTP</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgot} onPress={handleResendOtp} disabled={otpLoading}>
            <Text style={styles.forgotText}>Resend OTP</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#d13964', '#d94868']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#d13964" />
      <SafeAreaView style={styles.safe}>
        <Text style={styles.title}>Dating</Text>
        <Text style={styles.subtitle}>Login to your account</Text>

        <View style={styles.inputContainer}>
          <Icon name="phone-outline" size={20} color="#d13964" style={styles.icon} />
          <TextInput
            placeholder="Enter your mobile number"
            style={styles.input}
            placeholderTextColor="#333"
            keyboardType="phone-pad"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.inputContainer}>
          <Icon name="lock-outline" size={20} color="#d13964" style={styles.icon} />
          <TextInput
            placeholder="Enter your password"
            style={styles.input}
            placeholderTextColor="#333"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity
          style={styles.forgot}
          onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.loginButton, isPending && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={isPending}>
          {isPending ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.loginText}>LOGIN</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.outlinedButton}
          onPress={() => navigation.navigate('Register')}>
          <Text style={styles.outlinedText}>I DON'T HAVE AN ACCOUNT</Text>
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
  logo: { width: 60, height: 60, marginBottom: 10, resizeMode: 'contain' },
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
    marginBottom: 25,
  },
  otpHint: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 50,
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 50,
    width: '100%',
  },
  icon: { marginRight: 10 },
  input: { flex: 1, color: '#000' },
  forgot: { alignSelf: 'flex-end', marginBottom: 30 },
  forgotText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  loginButton: {
    backgroundColor: '#fff',
    borderRadius: 50,
    paddingVertical: 15,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  loginText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  outlinedButton: {
    borderColor: '#fff',
    borderWidth: 1,
    borderRadius: 50,
    paddingVertical: 15,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
  },
  outlinedText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});

export default LoginScreen;
