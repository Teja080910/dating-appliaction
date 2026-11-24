import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppContext from '../../context/CreateGlobalStateContext';
import { useTheme } from '../../theme';
import { getLanguageFlag, PROFILE_LANGUAGES } from '../../utils/languageHelper';
import { t, useTranslation } from '../../i18n';

const languages = PROFILE_LANGUAGES;

const LanguagesSelector = () => {
  useTranslation();
  const { themeColors } = useTheme();
  const { selectedLanguages, setSelectedLanguages } = useContext(AppContext);

  const toggleLanguage = (lang: string) => {
    const list = Array.isArray(selectedLanguages) ? selectedLanguages : [];
    const exists = list.some((item) => item.toLowerCase() === lang.toLowerCase());
    if (exists) {
      setSelectedLanguages(list.filter((item) => item.toLowerCase() !== lang.toLowerCase()));
    } else {
      setSelectedLanguages([...list, lang]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Icon name="translate" size={22} color={themeColors.text} style={styles.headerIcon} />
        <Text style={[styles.title, { color: themeColors.text }]}>{t('more_info.languagesselector.languages_you_speak')}</Text>
      </View>
      <View style={styles.optionsWrap}>
        {languages.map((lang) => {
          const list = Array.isArray(selectedLanguages) ? selectedLanguages : [];
          const isSelected = list.some((item) => item.toLowerCase() === lang.toLowerCase());
          const flag = getLanguageFlag(lang);
          return isSelected ? (
            <TouchableOpacity
              key={lang}
              activeOpacity={0.8}
              onPress={() => toggleLanguage(lang)}
              style={[styles.pillActive, { backgroundColor: themeColors.primary }]}
            >
              <Text style={styles.pillTextActive}>
                {flag}  {lang}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              key={lang}
              activeOpacity={0.7}
              onPress={() => toggleLanguage(lang)}
              style={[
                styles.pillInactive,
                {
                  backgroundColor: themeColors.surfaceLight,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <Text style={[styles.pillTextInactive, { color: themeColors.text }]}>
                {flag}  {lang}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default LanguagesSelector;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 26,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerIcon: {
    marginRight: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pillInactive: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillTextInactive: {
    fontSize: 14.5,
    fontWeight: '500',
  },
  pillActive: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillTextActive: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
