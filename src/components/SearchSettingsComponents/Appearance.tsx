import React, { useContext, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';
import { useTheme, ThemeColors, Spacing } from '../../theme';

const appearanceOptions = ['Very attractive', 'Attractive', 'Average', 'Below average'];

interface AppearanceProps {
  onChange?: (val: string[]) => void;
}

const Appearance: React.FC<AppearanceProps> = ({ onChange }) => {
  const { themeColors } = useTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const { selectedOptions, setSelectedOptions } = useContext(AppContext);

  const toggleOption = (option: string) => {
    const nextOptions = selectedOptions.includes(option)
      ? selectedOptions.filter((item: string) => item !== option)
      : [...selectedOptions, option];
    setSelectedOptions(nextOptions);
    if (onChange) onChange(nextOptions);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Appearance</Text>
      <View style={styles.optionsWrapper}>
        {appearanceOptions.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.option, selectedOptions.includes(option) && styles.optionSelected]}
            onPress={() => toggleOption(option)}
          >
            <Text style={[styles.optionText, selectedOptions.includes(option) && styles.optionTextSelected]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
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

export default Appearance;
