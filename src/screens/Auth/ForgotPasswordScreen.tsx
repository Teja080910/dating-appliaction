import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { authApi } from '../../api/authApi';
import { colors, radius } from '../../constants/theme';

const ForgotPasswordScreen = ({ navigation }: any) => {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!mobile) {
      Alert.alert('Error', 'Please enter your mobile number');
      return;
    }
    setLoading(true);
    try {
      await authApi.sendForgotOtp({ mobile });
      Alert.alert('Success', 'OTP sent to your mobile');
      setStep('otp');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp || !newPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword({ mobile, otp, newPassword });
      Alert.alert('Success', 'Password reset successfully');
      navigation.navigate('Login');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Text style={styles.appName}>Dating</Text>
        </View>

        <Text style={styles.forgotText}>Forgot Password</Text>

        {step === 'mobile' ? (
          <>
            <View style={styles.inputWrapper}>
              <Icon name="phone-outline" size={20} color={colors.primary} style={styles.icon} />
              <TextInput
                placeholder="Enter your mobile number"
                placeholderTextColor="#666"
                style={styles.input}
                keyboardType="phone-pad"
                value={mobile}
                onChangeText={setMobile}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
              onPress={handleSendOtp}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={styles.primaryBtnText}>Send OTP</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.inputWrapper}>
              <Icon name="key-variant" size={20} color={colors.primary} style={styles.icon} />
              <TextInput
                placeholder="Enter OTP"
                placeholderTextColor="#666"
                style={styles.input}
                keyboardType="number-pad"
                value={otp}
                onChangeText={setOtp}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Icon name="lock-outline" size={20} color={colors.primary} style={styles.icon} />
              <TextInput
                placeholder="Enter new password"
                placeholderTextColor="#666"
                secureTextEntry
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
              onPress={handleResetPassword}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={styles.primaryBtnText}>Reset Password</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('Login')}>
          <Text style={styles.secondaryBtnText}>Back to login</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 25,
    paddingBottom: 40,
  },
  logoContainer: { alignItems: 'center', marginBottom: 25 },
  logo: { width: 70, height: 70 },
  appName: {
    fontSize: 34,
    color: colors.surface,
    fontWeight: 'bold',
    marginTop: 5,
    fontFamily: 'sans-serif-medium',
  },
  forgotText: {
    color: colors.surface,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 25,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
    height: 55,
    elevation: 2,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: colors.ink },
  primaryBtn: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    elevation: 2,
  },
  primaryBtnText: { color: colors.primary, fontWeight: 'bold', fontSize: 15 },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.surface,
    borderRadius: radius.pill,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: { color: colors.surface, fontWeight: 'bold', fontSize: 15 },
});

export default ForgotPasswordScreen;
