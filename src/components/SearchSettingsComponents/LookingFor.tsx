import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';
import { Colors, Spacing } from '../../theme';

const options = ['Hookup', 'Casual AMARA', 'Relationship', 'Marriage', 'Online relationship'];

interface LookingForProps {
  onChange?: (val: string[]) => void;
}

const LookingFor: React.FC<LookingForProps> = ({ onChange }) => {
  const { lookingFor, setLookingFor } = useContext(AppContext);

  const toggleOption = (option: string) => {
    const nextLookingFor = lookingFor.includes(option)
      ? lookingFor.filter((item: string) => item !== option)
      : [...lookingFor, option];
    setLookingFor(nextLookingFor);
    if (onChange) onChange(nextLookingFor);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Looking for</Text>
      <View style={styles.optionsWrapper}>
        {options.map((item: string, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.option, lookingFor.includes(item) && styles.optionSelected]}
            onPress={() => toggleOption(item)}
          >
            <Text style={[styles.optionText, lookingFor.includes(item) && styles.optionTextSelected]}>
              {item}
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

export default LookingFor;
