import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppContext from '../../context/CreateGlobalStateContext';
import { authApi } from '../../api/authApi';
import { AuthStorage } from '../../api/authStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation } from '@tanstack/react-query';
import { colors, radius } from '../../constants/theme';

const RegisterScreen = ({ navigation }: any) => {
  const { name, setName, password, setPassword, email, setEmail } = useContext(AppContext);
  const [confirmPassword, setConfirmPassword] = useState('');

  const mutation = useMutation({
    mutationFn: (data: {
      name: string;
      mobile: string;
      password: string;
      confirmPassword: string;
      gender: string;
    }) => authApi.register(data),
    onSuccess: async (data, variables) => {
      const mobile = variables.mobile;
      const pwd = variables.password;

      if (data.token) {
        await AsyncStorage.setItem('user_id', data.userId || String(data.ID || data.id || ''));
        await AsyncStorage.setItem('user_id_num', String(data.ID || data.id || ''));
        await AsyncStorage.setItem('user_data', JSON.stringify(data));
        await AuthStorage.setToken(data.token);
        await AuthStorage.setUser(data);
        await AsyncStorage.setItem('isRegistered', 'true');
        navigation.replace('Privacy');
        return;
      }

      if (!data.sessionId) {
        Alert.alert(
          'Registration Failed',
          data?.message || data?.error || 'Could not create account. Please try again.',
        );
        return;
      }

      await AsyncStorage.setItem('reg_password', pwd);
      navigation.replace('OtpVerification', { sessionId: data.sessionId, mobile });
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Registration failed. Please try again.';
      Alert.alert('Registration Failed', msg);
    },
  });

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    mutation.mutate({
      name: name.trim(),
      mobile: email.trim(),
      password,
      confirmPassword,
      gender: 'male',
    });
  };

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          <Text style={styles.appName}>Dating</Text>
        </View>

        <Text style={styles.registerText}>Register Now</Text>

        <View style={styles.inputWrapper}>
          <Icon name="account-outline" size={20} color={colors.primary} style={styles.icon} />
          <TextInput
            placeholder="Enter your name"
            placeholderTextColor="#666"
            style={styles.input}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputWrapper}>
          <Icon name="phone-outline" size={20} color={colors.primary} style={styles.icon} />
          <TextInput
            placeholder="Enter your mobile number"
            placeholderTextColor="#666"
            style={styles.input}
            keyboardType="phone-pad"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.inputWrapper}>
          <Icon name="lock-outline" size={20} color={colors.primary} style={styles.icon} />
          <TextInput
            placeholder="Enter your password"
            placeholderTextColor="#666"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <View style={styles.inputWrapper}>
          <Icon name="lock-check-outline" size={20} color={colors.primary} style={styles.icon} />
          <TextInput
            placeholder="Confirm your password"
            placeholderTextColor="#666"
            secureTextEntry
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        <TouchableOpacity
          style={[styles.registerBtn, mutation.isPending && { opacity: 0.7 }]}
          onPress={handleRegister}
          disabled={mutation.isPending}>
          {mutation.isPending ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.registerBtnText}>REGISTER</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginBtnText}>I ALREADY HAVE AN ACCOUNT</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          By signing up, you agree to our{' '}
          <Text
            style={styles.link}
            onPress={() => Linking.openURL('https://example.com/terms')}>
            Terms
          </Text>
          . See how we use your data in our{' '}
          <Text
            style={styles.link}
            onPress={() => Linking.openURL('https://example.com/privacy')}>
            Privacy Policy
          </Text>
          .
        </Text>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 25,
  },
  logoContainer: { alignItems: 'center', marginBottom: 10 },
  logo: { width: 60, height: 60 },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.surface,
    marginTop: 5,
    fontFamily: 'sans-serif-medium',
  },
  registerText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 15,
    width: '100%',
    height: 55,
    elevation: 2,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, color: colors.ink, fontSize: 15 },
  registerBtn: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    width: '100%',
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
    elevation: 2,
  },
  registerBtnText: { color: colors.primary, fontWeight: 'bold', fontSize: 15 },
  loginBtn: {
    borderColor: colors.surface,
    borderWidth: 1,
    borderRadius: radius.pill,
    width: '100%',
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginBtnText: { color: colors.surface, fontWeight: 'bold', fontSize: 15 },
  footerText: {
    color: colors.surface,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginTop: 30,
    marginBottom: 10,
  },
  link: { textDecorationLine: 'underline', fontWeight: 'bold' },
});

export default RegisterScreen;
