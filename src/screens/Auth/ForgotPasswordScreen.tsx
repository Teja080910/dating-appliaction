import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ForgotPasswordScreen = ({ navigation }: any) => {
  return (
    <LinearGradient colors={['#ee486b', '#e14c61']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Logo + Glambu Name */}
        <View style={styles.logoContainer}>
          {/* <Image
            source={require('./assets/logo.png')} // 🔁 replace with your flame logo path
            style={styles.logo}
            resizeMode="contain"
          /> */}
          <Text style={styles.appName}>Dating</Text>
        </View>

        <Text style={styles.forgotText}>Forgot Password</Text>

        {/* Email Input */}
        <View style={styles.inputWrapper}>
          <Icon name="email-outline" size={20} color="#e14c61" style={styles.icon} />
          <TextInput
            placeholder="Enter your e-mail address"
            placeholderTextColor="#666"
            style={styles.input}
            keyboardType="email-address"
          />
        </View>

        {/* Request Reset Button */}
        <TouchableOpacity style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Request reset link</Text>
        </TouchableOpacity>

        {/* Back to Login */}
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.secondaryBtnText}>Back to login</Text>
        </TouchableOpacity>
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
    paddingHorizontal: 25,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  logo: {
    width: 70,
    height: 70,
  },
  appName: {
    fontSize: 34,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 5,
    fontFamily: 'sans-serif-medium',
  },
  forgotText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 25,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
    height: 55,
    elevation: 2,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },
  primaryBtn: {
    backgroundColor: '#fff',
    borderRadius: 30,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    elevation: 2,
  },
  primaryBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 15,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 30,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default ForgotPasswordScreen;
