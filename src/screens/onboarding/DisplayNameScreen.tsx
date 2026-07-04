import React, { useCallback, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  BackHandler,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AppContext from '../../context/CreateGlobalStateContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DisplayNameScreen = ({ navigation }: any) => {
  const { name, setName } = useContext(AppContext);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        AsyncStorage.getItem('isLoggedIn').then((isLoggedIn) => {
          if (isLoggedIn === 'true') {
            navigation.replace('Privacy');
          } else {
            navigation.replace('GenderOrientation');
          }
        });
        return true;
      };
      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backHandler.remove();
    }, [navigation])
  );

  const handleDisplayName = async () => {
    const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
    isLoggedIn === 'true'
      ? navigation.replace('UploadImage')
      : navigation.replace('DOB');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressBarContainer}>
        <View style={styles.progressFill} />
        <View style={styles.progressRemaining} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Dating!</Text>
        <Text style={styles.subtitle}>Please choose a display name!</Text>

        <TextInput
          style={styles.input}
          placeholder="Write your nickname here"
          placeholderTextColor="#666"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.helperText}>
          This name will appear on your profile.
        </Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            You can use your real name or a nickname
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.nextButton,
            name.trim() ? styles.nextButtonActive : {},
          ]}
          disabled={!name.trim()}
          onPress={handleDisplayName}>
          <Text
            style={[
              styles.nextButtonText,
              name.trim() ? styles.nextButtonTextActive : {},
            ]}>
            Next
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
  },
  progressBarContainer: {
    flexDirection: 'row',
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 20,
    marginBottom: 30,
  },
  progressFill: {
    width: '40%',
    backgroundColor: '#ee486b',
  },
  progressRemaining: {
    flex: 1,
    backgroundColor: '#ccc',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    color: '#000',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 30,
    color: '#000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000',
  },
  helperText: {
    color: '#888',
    marginTop: 6,
    fontSize: 14,
  },
  footer: {
    marginBottom: 30,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIcon: {
    fontSize: 16,
    color: '#aaa',
    marginRight: 6,
  },
  infoText: {
    color: '#aaa',
    fontSize: 14,
  },
  nextButton: {
    backgroundColor: '#e0e0e0',
    borderRadius: 50,
    paddingVertical: 15,
    alignItems: 'center',
  },
  nextButtonActive: {
    backgroundColor: '#ee486b',
  },
  nextButtonText: {
    color: '#888',
    fontWeight: '600',
    fontSize: 16,
  },
  nextButtonTextActive: {
    color: '#fff',
  },
});

export default DisplayNameScreen;
