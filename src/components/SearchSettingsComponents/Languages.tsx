import React, { useContext, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';
import { useTheme, ThemeColors, Spacing } from '../../theme';
import { getLanguageFlag, PROFILE_LANGUAGES } from '../../utils/languageHelper';
import { t, useTranslation } from '../../i18n';

const languages = PROFILE_LANGUAGES;

interface LanguagesProps {
  onChange?: (val: string[]) => void;
}

const Languages: React.FC<LanguagesProps> = ({ onChange }) => {
  useTranslation();
  const { themeColors } = useTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const { searchLanguages, setSearchLanguages } = useContext(AppContext);

  const toggleLanguage = (lang: string) => {
    const nextLanguages = searchLanguages.includes(lang)
      ? searchLanguages.filter((item: string) => item !== lang)
      : [...searchLanguages, lang];
    setSearchLanguages(nextLanguages);
    if (onChange) onChange(nextLanguages);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('profile.userdetails.languages')}</Text>
      <View style={styles.optionsContainer}>
        {languages.map((lang) => {
          const isSelected = searchLanguages.includes(lang);
          const flag = getLanguageFlag(lang);
          return (
            <TouchableOpacity
              key={lang}
              style={[styles.option, isSelected && styles.selectedOption]}
              onPress={() => toggleLanguage(lang)}
            >
              <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
                {flag}  {lang}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default Languages;

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
    optionsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    option: {
      borderWidth: 1,
      borderColor: themeColors.borderLight,
      borderRadius: Spacing.radiusFull,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      backgroundColor: themeColors.surfaceLight,
      marginBottom: Spacing.sm,
    },
    selectedOption: {
      backgroundColor: themeColors.primary,
      borderColor: themeColors.primary,
    },
    optionText: {
      color: themeColors.text,
      fontSize: 14,
      fontWeight: '500',
    },
    selectedOptionText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
  });
