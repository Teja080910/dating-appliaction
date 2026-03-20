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
  Dimensions,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppContext from '../../context/CreateGlobalStateContext';
import { saveGender } from '../../utils/types/AsyncStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GenderOrientationScreen = ({ navigation }: any) => {
  const { setSelected } = useContext(AppContext);
  const [selection, setSelection] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.replace('Privacy');
        return true;
      }
      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backHandler.remove();
    }, [navigation]),
  )

  const handleNext = async () => {
    if (selection) {
      try {
        console.log('Final Selection:', selection);
        setSelected(selection);
        await saveGender(selection);
        // CRITICAL: Set GenderOrientation to true so Routes.tsx knows we finished this step
        await AsyncStorage.setItem('GenderOrientation', 'true');
        
        console.log('Navigating to DisplayName...');
        navigation.navigate('DisplayName');
      } catch (error) {
        console.error('Navigation Error:', error);
        Alert.alert("Error", "Failed to save selection. Please try again.");
      }
    } else {
      Alert.alert("Selection Required", "Please select your gender and orientation to continue.");
    }
  };

  const renderCard = (label: string, value: string, icon: string) => {
    const isSelected = selection === value;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.card,
          isSelected && styles.selectedCard
        ]}
        onPress={() => {
            console.log('Selected:', value);
            setSelection(value);
        }}
      >
        <Icon name={icon} size={42} color={isSelected ? '#FF5A79' : '#CCC'} />
        <Text style={[styles.cardLabel, isSelected && styles.selectedCardLabel]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
          <View style={styles.progressFill} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>What's your gender and orientation?</Text>
        
        <View style={styles.cardsRow}>
          {renderCard("I'm a straight woman", "straight_woman", "gender-female")}
          {renderCard("I'm a straight man", "straight_man", "gender-male")}
          {renderCard("I'm LGBTQIA+", "lgbtqia", "equal")}
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.infoRow}>
            <View style={styles.infoIconCircle}>
                <Text style={styles.infoIconText}>i</Text>
            </View>
            <Text style={styles.infoText}>
                Men have total privacy at AMARA. Only people you invite can see your profile.
            </Text>
        </View>

        <TouchableOpacity
          style={[styles.nextButton, !selection && styles.disabledButton]}
          onPress={handleNext}
          activeOpacity={0.9}
        >
          <Text style={styles.nextText}>NEXT</Text>
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
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    width: '30%',
    height: '100%',
    backgroundColor: '#FF5A79',
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#333',
    textAlign: 'center',
    marginBottom: 25,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  card: {
    flex: 1,
    height: SCREEN_WIDTH * 0.45,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  selectedCard: {
    borderColor: '#FF5A79',
    borderWidth: 2,
    backgroundColor: '#FFF5F6',
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    textAlign: 'center',
    marginTop: 15,
    lineHeight: 18,
  },
  selectedCardLabel: {
    color: '#000',
  },
  footer: {
    paddingHorizontal: 25,
    paddingBottom: 40,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 5,
  },
  infoIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoIconText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#CCC',
    fontStyle: 'italic',
  },
  infoText: {
    flex: 1,
    fontSize: 12.5,
    color: '#AAA',
    lineHeight: 18,
  },
  nextButton: {
    backgroundColor: '#FF5A79',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF5A79',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: '#FF5A79',
    opacity: 0.4,
  },
  nextText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
