import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';
import { ENGLISH_LEVELS as englishLevels } from '../../constants/profileOptions';

const EnglishProficiency = () => {
  // const [englishProficiency, setEnglishProficiency] = useState<string[]>([]);

  const {englishProficiency, setEnglishProficiency} = useContext(AppContext)

  interface ToggleOption {
    (option: string): void;
  }

  const toggleOption: ToggleOption = (option) => {
    if (englishProficiency.includes(option)) {
      setEnglishProficiency(englishProficiency.filter((item: string) => item !== option));
    } else {
      setEnglishProficiency([...englishProficiency, option]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>How good is English?</Text>
      <View style={styles.optionsWrapper}>
        {englishLevels.map((level, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.option,
              englishProficiency.includes(level) && styles.optionSelected,
            ]}
            onPress={() => toggleOption(level)}
          >
            <Text
              style={[
                styles.optionText,
                englishProficiency.includes(level) && styles.optionTextSelected,
              ]}
            >
              {level}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 20,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 12,
    color: '#222',
  },
  optionsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10, // Requires React Native 0.71+
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 10,
    marginBottom: 10,
  },
  optionSelected: {
    backgroundColor: '#d33',
  },
  optionText: {
    fontSize: 15,
    color: '#222',
  },
  optionTextSelected: {
    color: '#fff',
  },
});

export default EnglishProficiency;
