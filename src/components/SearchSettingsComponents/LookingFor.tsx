import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';

const options = [
  'Hookup',
  'Casual dating',
  'Relationship',
  'Marriage',
  'Online relationship',
];

const LookingFor = () => {
  // const [lookingFor, setLookingFor] = useState<string[]>([]);

  const {lookingFor, setLookingFor} = useContext(AppContext)

  const toggleOption = (option: string) => {
    if (lookingFor.includes(option)) {
      setLookingFor(lookingFor.filter((item) => item !== option));
    } else {
      setLookingFor([...lookingFor, option]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Looking for</Text>
      <View style={styles.optionsWrapper}>
        {options.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.option,
              lookingFor.includes(item) && styles.optionSelected,
            ]}
            onPress={() => toggleOption(item)}
          >
            <Text
              style={[
                styles.optionText,
                lookingFor.includes(item) && styles.optionTextSelected,
              ]}
            >
              {item}
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
    gap: 10, // Use margin for older React Native versions
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

export default LookingFor;
