import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppContext from '../../context/CreateGlobalStateContext';
import { Colors, useTheme } from '../../theme';

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

const LanguagesSelector = () => {
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
        <Text style={[styles.title, { color: themeColors.text }]}>Languages you speak</Text>
      </View>
      <View style={styles.optionsWrap}>
        {languages.map((lang) => {
          const list = Array.isArray(selectedLanguages) ? selectedLanguages : [];
          const isSelected = list.some((item) => item.toLowerCase() === lang.toLowerCase());
          return isSelected ? (
            <TouchableOpacity
              key={lang}
              activeOpacity={0.8}
              onPress={() => toggleLanguage(lang)}
              style={styles.pillActiveWrapper}
            >
              <LinearGradient
                colors={[themeColors.primary, themeColors.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.pillActiveGradient}
              >
                <Text style={styles.pillTextActive}>{lang}</Text>
              </LinearGradient>
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
                  borderColor: themeColors.borderLight,
                },
              ]}
            >
              <Text style={[styles.pillTextInactive, { color: themeColors.text }]}>{lang}</Text>
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
    marginTop: 22,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    gap: 8,
  },
  pillInactive: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillTextInactive: {
    fontSize: 14.5,
    fontWeight: '500',
  },
  pillActiveWrapper: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  pillActiveGradient: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillTextActive: {
    fontSize: 14.5,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
