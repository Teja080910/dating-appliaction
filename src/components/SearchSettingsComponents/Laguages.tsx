import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';

const languages = [
  'English', 'Spanish', 'Portuguese', 'German',
  'Romanian', 'Russian', 'French', 'Chinese', 'Japanese',
];

const Languages = () => {
  const { searchLanguages, setSearchLanguages } = useContext(AppContext);

  const toggleLanguage = (lang: string) => {
    console.log('You clicked:', lang);
    console.log('Before click, selectedLanguages:', searchLanguages);

    if (searchLanguages.includes(lang)) {
      // If already selected, remove it
      const updatedLanguages = searchLanguages.filter( (item: string) => item !== lang);
      console.log('After removing:', updatedLanguages);
      setSearchLanguages(updatedLanguages);
    } else {
      // If not selected, add it 
      const updatedLanguages = [...searchLanguages, lang];
      console.log('After adding:', updatedLanguages);
      setSearchLanguages(updatedLanguages);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Languages</Text>
      <View style={styles.optionsContainer}>
        {languages.map((lang) => (
          <TouchableOpacity
            key={lang}
            style={[
              styles.option,
              searchLanguages.includes(lang) && styles.selectedOption
            ]}
            onPress={() => toggleLanguage(lang)}
          >
            <Text
              style={[
                styles.optionText,
                searchLanguages.includes(lang) && styles.selectedOptionText
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

export default Languages;

const styles = StyleSheet.create({
  container: { 
    marginVertical: 16, 
    paddingHorizontal: 16 
  },
  label: { 
    marginLeft:6,
    fontSize: 16, 
    marginBottom: 10,
    fontWeight:"bold"
  },
  optionsContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap' 
  },
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