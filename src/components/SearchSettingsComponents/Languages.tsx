import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';
import { Colors, Spacing } from '../../theme';

const languages = [
  'English', 'Spanish', 'Portuguese', 'German',
  'Romanian', 'Russian', 'French', 'Chinese', 'Japanese',
];

interface LanguagesProps {
  onChange?: (val: string[]) => void;
}

const Languages: React.FC<LanguagesProps> = ({ onChange }) => {
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
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  option: {
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Spacing.radiusFull,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.inputBackground,
    marginBottom: Spacing.sm,
  },
  selectedOption: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  selectedOptionText: {
    color: Colors.white,
    fontWeight: '600',
  },
});
