import React, { useContext, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';
import { useTheme, ThemeColors, Spacing } from '../../theme';
import { t, useTranslation } from '../../i18n';

const englishLevels = ['Basic', 'Medium', 'Good', 'Very Good'];
const englishLevelLabel = (val: string) =>
  val === 'Basic' ? t('onboarding.moredetailsscreen.basic')
  : val === 'Medium' ? t('profile.userdetails.medium')
  : val;

interface EnglishProficiencyProps {
  onChange?: (val: string[]) => void;
}

const EnglishProficiency: React.FC<EnglishProficiencyProps> = ({ onChange }) => {
  useTranslation();
  const { themeColors } = useTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
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
      <Text style={styles.label}>{t('search.englishproficiency.english_level')}</Text>
      <View style={styles.optionsWrapper}>
        {englishLevels.map((level, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.option, englishProficiency.includes(level) && styles.optionSelected]}
            onPress={() => toggleOption(level)}
          >
            <Text style={[styles.optionText, englishProficiency.includes(level) && styles.optionTextSelected]}>
              {englishLevelLabel(level)}
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

export default EnglishProficiency;
