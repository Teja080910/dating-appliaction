import React, { useContext, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';
import AppContext from '../../context/CreateGlobalStateContext';

const PrivacyScreen = ({ navigation }: any) => {
  const { login } = useContext(AppContext);
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true // Disable back button
    );
    // console.log("backHandler", backHandler);
    
    
    return () => backHandler.remove();
  }, []);

  const handleAccept = async () => {
    const isLoggedIn = await AsyncStorage.getItem('isLoggedIn')
    await AsyncStorage.setItem('acceptedTerms', 'true');
    await AsyncStorage.setItem('GenderOrientation', 'true'); 
    // const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
    console.log('acceptedTerms',await AsyncStorage.getItem('acceptedTerms'));
    console.log('GenderOrientation',await AsyncStorage.getItem('GenderOrientation'));
    
    console.log('isLoggedIn', isLoggedIn);
    
    isLoggedIn === 'true' ? navigation.replace('DisplayName') : navigation.replace('GenderOrientation'); // Change this to your main screen
    // navigation.replace('GenderOrientation'); // Change this to your main screen
  };

  // console.log("handleAccept", handleAccept);
  

  return (
    <View style={styles.container}>
      {/* Progress bar */}
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
        onPress={() => navigation.navigate('PrivacyPolicy', { type: 'terms' })}
      >
        <Text style={styles.linkText}>📄 Terms of Use</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkBtn}
        onPress={() => navigation.navigate('PrivacyPolicy', { type: 'privacy' })}
      >
        <Text style={styles.linkText}>📄 Privacy Policy</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>
        We store your primary account information such as location, the personal information you specified and usage data only for the purpose of improving our app development and suggesting our users the best possible matching partners.
      </Text>

      <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}>
        <Text style={styles.acceptBtnText}>Accept terms and privacy policy</Text>
      </TouchableOpacity>
    </View>
  );
};

export default PrivacyScreen;

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
    backgroundColor: '#FF5A79',
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
    backgroundColor: '#FF5A79',
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
