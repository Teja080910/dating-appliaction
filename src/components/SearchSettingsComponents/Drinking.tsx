import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing } from '../../theme';

const options = [
  { label: 'Any', value: undefined },
  { label: 'Yes', value: true },
  { label: 'No', value: false },
];

interface DrinkingProps {
  value?: boolean;
  onChange?: (val: boolean | undefined) => void;
}

const Drinking: React.FC<DrinkingProps> = ({ value, onChange }) => (
  <View style={styles.container}>
    <Text style={styles.label}>Do you drink?</Text>
    <View style={styles.optionsWrapper}>
      {options.map((item) => (
        <TouchableOpacity
          key={item.label}
          style={[styles.option, value === item.value && styles.optionSelected]}
          onPress={() => onChange?.(item.value)}
        >
          <Text style={[styles.optionText, value === item.value && styles.optionTextSelected]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

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

export default Drinking;
