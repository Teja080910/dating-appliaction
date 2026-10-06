import React, { useContext, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';
import { useTheme, ThemeColors, Spacing } from '../../theme';

const ethnicityOptions = [
  'Asian',
  'Black/African descent',
  'South Asian',
  'Middle Eastern',
  'Pacific Islander',
  'White/Caucasian',
  'Latin/Hispanic',
  'Mixed',
  'Indigenous',
  'Other',
];

interface EthnicityProps {
  onChange?: (val: string[]) => void;
}

const Ethnicity: React.FC<EthnicityProps> = ({ onChange }) => {
  const { themeColors } = useTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const { ethnicity, setEthnicity } = useContext(AppContext);

  const toggleOption = (option: string): void => {
    const nextEthnicity = ethnicity.includes(option)
      ? ethnicity.filter((item: string) => item !== option)
      : [...ethnicity, option];
    setEthnicity(nextEthnicity);
    if (onChange) onChange(nextEthnicity);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Ethnicity</Text>
      <View style={styles.optionsWrapper}>
        {ethnicityOptions.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.option, ethnicity.includes(item) && styles.optionSelected]}
            onPress={() => toggleOption(item)}
          >
            <Text style={[styles.optionText, ethnicity.includes(item) && styles.optionTextSelected]}>
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

export default Ethnicity;
