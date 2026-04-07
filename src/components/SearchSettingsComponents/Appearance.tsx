import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';

const appearanceOptions = [
  'Very attractive',
  'Attractive',
  'Average',
  'Below Average',
];

interface AppearanceProps {
  onChange?: (val: string[]) => void;
}

const Appearance: React.FC<AppearanceProps> = ({ onChange }) => {
  const { selectedOptions, setSelectedOptions } = useContext(AppContext);

  const toggleOption = (option: string) => {
    let nextOptions;
    if (selectedOptions.includes(option)) {
      nextOptions = selectedOptions.filter((item: string) => item !== option);
    } else {
      nextOptions = [...selectedOptions, option];
    }
    setSelectedOptions(nextOptions);
    if (onChange) {
      onChange(nextOptions);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Appearance</Text>
      <View style={styles.optionsWrapper}>
        {appearanceOptions.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.option,
              selectedOptions.includes(option) && styles.optionSelected
            ]}
            onPress={() => toggleOption(option)}
          >
            <Text
              style={[
                styles.optionText,
                selectedOptions.includes(option) && styles.optionTextSelected
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
    gap: 10,
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
    // borderColor: '#222',
  },
  optionText: {
    fontSize: 15,
    color: '#222',
  },
  optionTextSelected: {
    color: '#fff',
  },
});

export default Appearance;
