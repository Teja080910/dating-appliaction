

import React, { useCallback, useContext, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  BackHandler,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import Icon from 'react-native-vector-icons/FontAwesome5';
import AppContext from '../../context/CreateGlobalStateContext';
import { useFocusEffect } from '@react-navigation/native';

const DOBScreen = ({ navigation }: any) => {
  const { date, setDate } = useContext(AppContext);
  const [open, setOpen] = useState(false);

  const handleNext = () => {
    navigation.navigate('UploadImage'); // Replace with your next screen
  };

  useFocusEffect(
    useCallback( () => {
    
      const onBackPress = () => {
        navigation.replace('DisplayName')
        return true;
      }
      const backHandler = 
        BackHandler.addEventListener('hardwareBackPress', onBackPress)
        return () => backHandler.remove();
    },[navigation])
  )

  const formattedDate = date.toLocaleDateString('en-GB'); // format like "11/04/2025"

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarFill} />
      </View>

      {/* Title */}
      <Text style={styles.title}>When are you born?</Text>

      {/* Touchable Date Display */}
      <TouchableOpacity style={styles.dateDisplay} onPress={() => setOpen(true)}>
        <Text style={styles.dateText}>{formattedDate}</Text>
      </TouchableOpacity>

      {/* Date Picker Modal */}
      <DatePicker
        modal
        open={open}
        date={date}
        mode="date"
        onConfirm={(selectedDate) => {
          setOpen(false);
          setDate(selectedDate);
        }}
        onCancel={() => setOpen(false)}
      />

      {/* Bottom Info */}
      <View style={styles.bottomContainer}>
        <View style={styles.infoContainer}>
          <Icon name="info-circle" size={14} color="#999" style={{ marginTop: 2 }} />
          <Text style={styles.infoText}>
            Did you know that you have 100% privacy at AMARA? Only the people
            who you have sent an invitation to will be able to view your profile!
          </Text>
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default DOBScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
  },
  progressBarContainer: {
    height: 5,
    backgroundColor: '#eee',
    marginTop: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '60%',
    height: '100%',
    backgroundColor: '#E94057',
  },
  title: {
    marginTop: 30,
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    color: '#000',
  },
  dateDisplay: {
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#000',
  },
  bottomContainer: {
    marginTop: 'auto',
    paddingBottom: 30,
  },
  infoContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  infoText: {
    fontSize: 12,
    color: '#999',
    flex: 1,
  },
  nextButton: {
    backgroundColor: '#E94057',
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
