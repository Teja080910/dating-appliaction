import { useFocusEffect } from '@react-navigation/native';
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
import Icon from 'react-native-vector-icons/FontAwesome5'; // for gender icons
import AppContext from '../../context/CreateGlobalStateContext';
import { saveGender } from '../../utils/types/AsyncStorage';

const GenderOrientationScreen = ({ navigation }: any) => {
  // const [selected, setSelected] = useState<string | null>(null);

  const {selected, setSelected} = useContext(AppContext);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.replace('Privacy'); // Go back to the previous screen
        return true; // Prevent default behavior
      }
      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backHandler.remove(); // Cleanup the event listener on unmount
    },[navigation]),
  )

  const options = [
    { label: "I'm a straight woman", icon: 'venus', value: 'straight_woman' },
    { label: "I'm a straight man", icon: 'mars', value: 'straight_man' },
    { label: "I’m LGBTQIA+", icon: 'bars', value: 'lgbtqia' },
  ];

  const handleNext = () => {
    if (selected) {
      navigation.navigate('DisplayName'); // replace with actual screen
    }
  };

 
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarFill} />
      </View>

      <Text style={styles.title}>What's your gender and orientation?</Text>

      {/* Option Buttons */}
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              selected === option.value && styles.selectedOption,
            ]}
            onPress={() => {
              setSelected(option.value)
              saveGender(option.value); 
              console.log('saveGender', option.value);
                  
            } }
          >
            <Icon
              name={option.icon}
              size={24}
              color={selected === option.value ? '#E94057' : '#555'}
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.optionText}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bottom Info and Next Button */}
      <View style={styles.bottomContainer}>
        <View style={styles.infoContainer}>
          <Icon name="info-circle" size={16} color="#999" />
          <Text style={styles.infoText}>
            Men have total privacy at Dating. Only people you invite can see your profile.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.nextButton, !selected && styles.disabledButton]}
          onPress={handleNext}
          disabled={!selected}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );   
};

export default GenderOrientationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
  },
  progressBarContainer: {
    height: 5,
    backgroundColor: '#e0e0e0',
    marginTop: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '20%',
    height: '100%',
    backgroundColor: '#E94057',
  },
  title: {
    marginTop: 30,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
  },
  optionsContainer: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionButton: {
    width: '30%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  selectedOption: {
    borderColor: '#E94057',
    backgroundColor: '#fff0f3',
  },
  optionText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#555',
  },
  bottomContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 30,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
    flex: 1,
  },
  nextButton: {
    backgroundColor: '#E94057',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ddd',
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
