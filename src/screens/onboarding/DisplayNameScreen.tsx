import React, { useContext, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, BackHandler, StatusBar
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AppContext from '../../context/CreateGlobalStateContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

const DisplayNameScreen = ({ navigation }: any) => {
  const { name, setName, displayName, setDisplayName } = useContext(AppContext);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.setItem('onboardingStep', 'DisplayName');

      const onBackPress = () => {
        navigation.replace('GenderOrientation');
        return true;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backHandler.remove();
    }, [navigation])
  );

  const currentName = displayName || name || '';

  const handleDisplayName = async () => {
    if (!currentName.trim()) return;

    const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');

    if (isLoggedIn === 'true') {
      navigation.navigate('UploadImage');
    } else {
      navigation.navigate('DOB');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to AMARA!</Text>
        <Text style={styles.subtitle}>Please choose a display name!</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter name"
          placeholderTextColor="#999"
          value={currentName}
          onChangeText={(text) => {
            setDisplayName(text);
            setName(text);
          }}
          autoFocus
        />

        <View style={styles.spacer} />

        <TouchableOpacity
          style={[styles.btn, !currentName.trim() && { opacity: 0.5 }]}
          disabled={!currentName.trim()}
          onPress={handleDisplayName}
        >
          <Text style={styles.btnText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default DisplayNameScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 25, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '900', color: '#000', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 30 },
  input: { 
    borderWidth: 1.5, 
    borderColor: '#FF5A79', 
    padding: 16, 
    borderRadius: 15, 
    fontSize: 16, 
    color: '#000',
    backgroundColor: '#FAFAFA'
  },
  spacer: { flex: 1 },
  btn: { 
    backgroundColor: '#FF5A79', 
    padding: 18, 
    borderRadius: 30,
    shadowColor: '#FF5A79',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5
  },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 18 }
});
