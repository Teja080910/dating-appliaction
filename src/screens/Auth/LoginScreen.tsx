import React, { useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../../utils/colors';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppContext from '../../context/CreateGlobalStateContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useLoginSubmit} from '../../api/useRegisterMutation';
import Toast from 'react-native-toast-message';
import { useLoginMutation } from '../../api/useLoginMutation';

const LoginScreen = ({navigation}: any) => {
  // const { loginSubmit } = useLoginSubmit();
  const {   setEmail, password, setPassword, email, username, setUsername } = useContext(AppContext);
  const { mutate: login } = useLoginMutation();

  const handleLogin = async () => {

    if (!username || !password) {
      Alert.alert('Error', 'Please enter both phone number and password');
      return;
    }

    try {
      await login({ username, password });
    } catch (error) {
      // Error is already handled in useLoginMutation
      console.error('Login error:', error);
    }

    
    
  }
  return (
    <LinearGradient colors={[Colors.pink, '#D94466']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.pink} />
      <SafeAreaView style={styles.safe}>
        {/* <Image
          source={require('../assets/logo.png')} // Add your flame "g" logo here
          style={styles.logo}
        /> */}
        <Text style={styles.title}>AMARA</Text>
        <Text style={styles.subtitle}>Login to your account</Text>

        <View style={styles.inputContainer}>
          <Icon name="email-outline" size={20} color="#FF5A79" style={styles.icon} />
          <TextInput
            placeholder="Enter your e-mail address"
            style={styles.input}
            placeholderTextColor="#333"
            keyboardType="phone-pad"
            value={username}
            onChangeText={setUsername}
        
          />
        </View>

        <View style={styles.inputContainer}>
          <Icon name="lock-outline" size={20} color="#FF5A79" style={styles.icon} />
          <TextInput
            placeholder="Enter your password"
            style={styles.input}
            placeholderTextColor="#333"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity style={styles.forgot}
         onPress={() => navigation.navigate('ForgotPassword')} 
        >
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginButton}
        onPress={ handleLogin}
        >
          <Text style={styles.loginText}>LOGIN</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.outlinedButton}
        onPress={() => navigation.navigate('Register')} 
        >
          <Text style={styles.outlinedText}>I DON’T HAVE AN ACCOUNT</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 10,
    resizeMode: 'contain',
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
    marginBottom: 25,
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 50,
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 50,
    width: '100%',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: Colors.darkGrey,
  },
  forgot: {
    alignSelf: 'flex-end',
    marginBottom: 30,
  },
  forgotText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  loginButton: {
    backgroundColor: Colors.white,
    borderRadius: 50,
    paddingVertical: 15,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  loginText: {
    color: Colors.pink,
    fontWeight: 'bold',
    fontSize: 16,
  },
  outlinedButton: {
    borderColor: Colors.white,
    borderWidth: 1,
    borderRadius: 50,
    paddingVertical: 15,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
  },
  outlinedText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default LoginScreen;
