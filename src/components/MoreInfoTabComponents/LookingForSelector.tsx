import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';
import { LOOKING_FOR_OPTIONS as options } from '../../constants/profileOptions';

const LookingForSelector = () => {
  // const [selectedLookingFor, setSelectedLookingFor] = useState<string[]>([]);

  const { selectedLookingFor, setSelectedLookingFor } = useContext(AppContext);

  const toggleOption = (option: string) => {
    if (selectedLookingFor.includes(option)) {
      setSelectedLookingFor(selectedLookingFor.filter(item => item !== option));
    } else {
      setSelectedLookingFor([...selectedLookingFor, option]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Looking for</Text>
      <View style={styles.optionContainer}>
        {options.map(option => (
          <TouchableOpacity
            key={option}
            onPress={() => toggleOption(option)}
            style={[
              styles.option,
              selectedLookingFor.includes(option) && styles.selectedOption,
            ]}
          >
            <Text
              style={[
                styles.optionText,
                selectedLookingFor.includes(option) && styles.selectedText,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default LookingForSelector;

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  title: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 12,
    paddingHorizontal: 20, // align with screen edge
  },
  optionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20, // align with screen edge
  },
  option: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 25,
    borderColor: '#ccc',
    borderWidth: 1,
    backgroundColor: '#f9f9f9',
  },
  selectedOption: {
    backgroundColor: '#DE3C4B',
    borderColor: '#DE3C4B',
  },
  optionText: {
    color: '#333',
    fontSize: 14,
  },
  selectedText: {
    color: '#fff',
    fontWeight: '500',
  },
});
