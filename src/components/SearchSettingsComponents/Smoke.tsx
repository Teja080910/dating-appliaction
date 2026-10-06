import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, ThemeColors, Spacing } from '../../theme';

const options = [
  { label: 'Yes', value: 'Yes' },
  { label: 'No', value: 'No' },
  { label: 'Sometimes', value: 'Sometimes' },
];

interface SmokeProps {
  value?: string | boolean;
  onChange?: (val: string | undefined) => void;
}

const isOptionSelected = (currentVal: string | boolean | undefined, optionVal: string) => {
  if (currentVal === undefined || currentVal === null) return false;
  if (typeof currentVal === 'boolean') {
    if (optionVal === 'Yes') return currentVal === true;
    if (optionVal === 'No') return currentVal === false;
    return false;
  }
  return String(currentVal).toLowerCase() === optionVal.toLowerCase();
};

const Smoke: React.FC<SmokeProps> = ({ value, onChange }) => {
  const { themeColors } = useTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  const handlePress = (optVal: string) => {
    if (isOptionSelected(value, optVal)) {
      onChange?.(undefined);
    } else {
      onChange?.(optVal);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Smoker?</Text>
      <View style={styles.optionsWrapper}>
        {options.map((item) => {
          const selected = isOptionSelected(value, item.value);
          return (
            <TouchableOpacity
              key={item.label}
              style={[styles.option, selected && styles.optionSelected]}
              onPress={() => handlePress(item.value)}
            >
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    container: {
      padding: Spacing.xl,
      backgroundColor: themeColors.surface,
      marginHorizontal: Spacing.screenPaddingHorizontal,
      marginTop: Spacing.lg,
      borderRadius: Spacing.radiusXl,
      borderWidth: 1,
      borderColor: themeColors.borderLight,
    },
    label: {
      fontWeight: '600',
      fontSize: 15,
      marginBottom: Spacing.md,
      color: themeColors.textSecondary,
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
      borderColor: themeColors.borderLight,
      backgroundColor: themeColors.surfaceLight,
      marginBottom: Spacing.sm,
    },
    optionSelected: {
      backgroundColor: themeColors.primary,
      borderColor: themeColors.primary,
    },
    optionText: {
      fontSize: 14,
      color: themeColors.text,
      fontWeight: '500',
    },
    optionTextSelected: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
  });

export default Smoke;
