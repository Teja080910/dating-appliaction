import React, { useContext } from 'react';
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
import { colors, radius } from '../../constants/theme';

const LoginScreen = ({ navigation }: any) => {
  const { password, setPassword, email, setEmail } = useContext(AppContext);
  const { mutate: login, isPending } = useLoginMutation();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both mobile number and password');
      return;
    }
    login({ mobile: email, password });
  };

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.gradientStart} />
      <SafeAreaView style={styles.safe}>
        <Text style={styles.title}>Dating</Text>
        <Text style={styles.subtitle}>Login to your account</Text>

        <View style={styles.inputContainer}>
          <Icon name="phone-outline" size={20} color={colors.primary} style={styles.icon} />
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
          <Icon name="lock-outline" size={20} color={colors.primary} style={styles.icon} />
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
            <ActivityIndicator color={colors.primary} />
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
    color: colors.surface,
    marginBottom: 30,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.surface,
    marginBottom: 25,
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 50,
    width: '100%',
  },
  icon: { marginRight: 10 },
  input: { flex: 1, color: colors.ink },
  forgot: { alignSelf: 'flex-end', marginBottom: 30 },
  forgotText: { color: colors.surface, fontSize: 14, fontWeight: 'bold' },
  loginButton: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingVertical: 15,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  loginText: { color: colors.primary, fontWeight: 'bold', fontSize: 16 },
  outlinedButton: {
    borderColor: colors.surface,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: 15,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
  },
  outlinedText: { color: colors.surface, fontWeight: 'bold', fontSize: 14 },
});

export default LoginScreen;
