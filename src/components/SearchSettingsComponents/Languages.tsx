import React, { useContext, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';
import { useTheme, ThemeColors, Spacing } from '../../theme';

const languages = [
  'English',
  'Spanish',
  'Portuguese',
  'German',
  'Romanian',
  'Russian',
  'French',
  'Chinese',
  'Japanese',
  'Indonesian',
];

interface LanguagesProps {
  onChange?: (val: string[]) => void;
}

const Languages: React.FC<LanguagesProps> = ({ onChange }) => {
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
      <Text style={styles.label}>Languages</Text>
      <View style={styles.optionsContainer}>
        {languages.map((lang) => (
          <TouchableOpacity
            key={lang}
            style={[styles.option, searchLanguages.includes(lang) && styles.selectedOption]}
            onPress={() => toggleLanguage(lang)}
          >
            <Text style={[styles.optionText, searchLanguages.includes(lang) && styles.selectedOptionText]}>
              {lang}
            </Text>
          </TouchableOpacity>
        ))}
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
      fontWeight: '600',
      fontSize: 15,
      marginBottom: Spacing.md,
      color: themeColors.textSecondary,
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
