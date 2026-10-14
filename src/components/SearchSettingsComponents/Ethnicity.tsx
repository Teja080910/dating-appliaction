import React, { useContext, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';
import { useTheme, ThemeColors, Spacing } from '../../theme';
import { t, useTranslation } from '../../i18n';

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
const ethnicityLabel = (val: string) =>
  val === 'Asian' ? t('profile.viewmyprofilescreen.asian')
  : val === 'Other' ? t('profile.userdetails.other')
  : val;

interface EthnicityProps {
  onChange?: (val: string[]) => void;
}

const Ethnicity: React.FC<EthnicityProps> = ({ onChange }) => {
  useTranslation();
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
      <Text style={styles.label}>{t('search.ethnicity.race_ethnicity')}</Text>
      <View style={styles.optionsWrapper}>
        {ethnicityOptions.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.option, ethnicity.includes(item) && styles.optionSelected]}
            onPress={() => toggleOption(item)}
          >
            <Text style={[styles.optionText, ethnicity.includes(item) && styles.optionTextSelected]}>
              {ethnicityLabel(item)}
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
      fontWeight: '700',
      fontSize: 16,
      marginBottom: Spacing.md,
      color: themeColors.text,
      letterSpacing: 0.1,
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
