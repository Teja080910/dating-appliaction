import React, { useContext, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';
import { useTheme, ThemeColors, Spacing } from '../../theme';

const options = [
  'Hookup',
  'Casual dating',
  'Online relationship',
  'Relationship',
  'Marriage',
];

interface LookingForProps {
  onChange?: (val: string[]) => void;
}

const LookingFor: React.FC<LookingForProps> = ({ onChange }) => {
  const { themeColors } = useTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
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

export default LookingFor;
