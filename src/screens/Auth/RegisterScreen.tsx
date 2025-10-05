import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useContext} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ScrollView,
  Image,
  LogBox
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppContext from '../../context/CreateGlobalStateContext';
// import useRegisterMutation from '../../api/useRegisterMutation';

const RegisterScreen = ({navigation}: any) => {
  // LogBox.ignoreAllLogs()
  // const mutation = useRegisterMutation();
  const {email, setEmail, password, setPassword} = useContext(AppContext);

  const handleRegister = async () => {
    // mutation.mutate({email, password});
    await AsyncStorage.setItem('isRegistered', 'true');
    console.log('isRegistered', await AsyncStorage.getItem('isRegistered'));
    console.log('Email:', email);
    console.log('Password:', password);
    navigation.replace('Privacy');
  };

  return (
    <LinearGradient colors={['#ee486b', '#e14c61']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          {/* <Image
            source={require('./assets/logo.png')} // 🔁 Put your glambu logo here
            style={styles.logo}
            resizeMode="contain"
          /> */}
          <Text style={styles.appName}>Dating</Text>
        </View>

        <Text style={styles.registerText}>Register Now</Text>

        <View style={styles.inputWrapper}>
          <Icon
            name="email-outline"
            size={20}
            color="#e14c61"
            style={styles.icon}
          />
          <TextInput
            placeholder="Enter your e-mail address"
            placeholderTextColor="#666"
            style={styles.input}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.inputWrapper}>
          <Icon
            name="lock-outline"
            size={20}
            color="#e14c61"
            style={styles.icon}
          />
          <TextInput
            placeholder="Enter your password"
            placeholderTextColor="#666"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity
          style={styles.registerBtn}
          onPress={handleRegister}>
          <Text style={styles.registerBtnText}>REGISTER</Text>
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
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 25,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 60,
    height: 60,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 5,
    fontFamily: 'sans-serif-medium',
  },
  registerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 15,
    width: '100%',
    height: 55,
    elevation: 2,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#000',
    fontSize: 15,
  },
  registerBtn: {
    backgroundColor: '#fff',
    borderRadius: 30,
    width: '100%',
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
    elevation: 2,
  },
  registerBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 15,
  },
  loginBtn: {
    borderColor: '#fff',
    borderWidth: 1,
    borderRadius: 30,
    width: '100%',
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  footerText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginTop: 30,
    marginBottom: 10,
  },
  link: {
    textDecorationLine: 'underline',
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
