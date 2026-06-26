import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';
import { Colors, Spacing } from '../../theme';

const englishLevels = ['Bad', 'Medium', 'Good', 'Very good'];

interface EnglishProficiencyProps {
  onChange?: (val: string[]) => void;
}

const EnglishProficiency: React.FC<EnglishProficiencyProps> = ({ onChange }) => {
  const { englishProficiency, setEnglishProficiency } = useContext(AppContext);

  const toggleOption = (option: string) => {
    const nextProficiency = englishProficiency.includes(option)
      ? englishProficiency.filter((item: string) => item !== option)
      : [...englishProficiency, option];
    setEnglishProficiency(nextProficiency);
    if (onChange) onChange(nextProficiency);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>How good is English?</Text>
      <View style={styles.optionsWrapper}>
        {englishLevels.map((level, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.option, englishProficiency.includes(level) && styles.optionSelected]}
            onPress={() => toggleOption(level)}
          >
            <Text style={[styles.optionText, englishProficiency.includes(level) && styles.optionTextSelected]}>
              {level}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

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
  optionsWrapper: {
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
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: Colors.white,
    fontWeight: '600',
  },
});

export default EnglishProficiency;
