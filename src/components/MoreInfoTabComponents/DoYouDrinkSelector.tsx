import React, { useContext } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';
import { SMOKE_DRINK_OPTIONS as OPTIONS } from '../../constants/profileOptions';
import { colors, radius } from '../../constants/theme';

const DoYouDrinkSelector = () => {
  const { selectedDrink, setSelectedDrink } = useContext(AppContext);

  const toggleSelect = (item: string) => {
    setSelectedDrink(prev => (prev === item ? null : item));
  };

  return (
    <View style={styles.section}>
      <Text style={styles.label}>Do you drink?</Text>
      <View style={styles.optionsContainer}>
        {OPTIONS.map(option => (
          <Pressable
            key={option}
            onPress={() => toggleSelect(option)}
            style={[
              styles.option,
              selectedDrink === option && styles.selectedOption
            ]}
          >
            <Text style={[
              styles.optionText,
              selectedDrink === option && styles.selectedText
            ]}>
              {option}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: { 
    marginVertical: 20, 
    paddingHorizontal: 16 
  },
  label: { 
    fontSize: 16, 
    fontWeight: '600', 
    marginBottom: 12 
  },
  optionsContainer: { 
    flexDirection: 'row', 
    gap: 10 
  },
  option: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: colors.surfaceAlt,
  },
  selectedOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    color: colors.ink,
    fontSize: 14,
  },
  selectedText: {
    color: colors.surface,
  }
});

export default DoYouDrinkSelector;
