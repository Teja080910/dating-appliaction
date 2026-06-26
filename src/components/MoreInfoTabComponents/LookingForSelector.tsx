import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';
import { Colors, Spacing } from '../../theme';

const options = [
  'Hookup',
  'Casual AMARA',
  'Relationship',
  'Marriage',
  'Online relationship',
];

const LookingForSelector = () => {
  const { selectedLookingFor, setSelectedLookingFor } = useContext(AppContext);

  const toggleOption = (option: string) => {
    if (selectedLookingFor.includes(option)) {
      setSelectedLookingFor(selectedLookingFor.filter((item: string) => item !== option));
    } else {
      setSelectedLookingFor([...selectedLookingFor, option]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Looking for</Text>
      <View style={styles.optionsContainer}>
        {options.map((item: string) => (
          <TouchableOpacity
            key={item}
            onPress={() => toggleOption(item)}
            style={[styles.option, selectedLookingFor.includes(item) && styles.optionSelected]}
          >
            <Text style={[styles.optionText, selectedLookingFor.includes(item) && styles.optionTextSelected]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default LookingForSelector;

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.screenPaddingHorizontal,
    marginTop: Spacing.lg,
    borderRadius: Spacing.radiusXl,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  label: {
    fontWeight: '600',
    fontSize: 15,
    marginBottom: Spacing.md,
    color: Colors.textSecondary,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  option: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Spacing.radiusFull,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    backgroundColor: Colors.inputBackground,
    marginBottom: Spacing.sm,
  },
  optionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: Colors.white,
    fontWeight: '600',
  },
});
