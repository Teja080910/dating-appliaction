import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';
import { LANGUAGES as languages } from '../../constants/profileOptions';

const LanguagesSelector = () => {
  const { selectedLanguages, setSelectedLanguages } = useContext(AppContext);

  const toggleLanguage = (lang: string) => {
    if (selectedLanguages.includes(lang)) {
      const updatedLanguages = selectedLanguages.filter( item => item !== lang);
      setSelectedLanguages(updatedLanguages);
    } else {
      const updatedLanguages = [...selectedLanguages, lang];
      setSelectedLanguages(updatedLanguages);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Languages you speak</Text>
      <View style={styles.optionsContainer}>
        {languages.map((lang) => (
          <TouchableOpacity
            key={lang}
            style={[
              styles.option,
              selectedLanguages.includes(lang) && styles.selectedOption
            ]}
            onPress={() => toggleLanguage(lang)}
          >
            <Text
              style={[
                styles.optionText,
                selectedLanguages.includes(lang) && styles.selectedOptionText
              ]}
            >
              {lang}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default LanguagesSelector;

const styles = StyleSheet.create({
  container: { marginVertical: 16, paddingHorizontal: 16 },
  label: { fontSize: 16, marginBottom: 10 },
  optionsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  option: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    margin: 6,
  },
  selectedOption: {
    backgroundColor: '#d33',
    borderColor: '#d33',
  },
  optionText: {
    color: '#333',
  },
  selectedOptionText: {
    color: '#fff',
  },
});
