import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';

const ethnicityOptions = [
  'Asian',
  'Black / African Descent',
  'Latin / Hispanic',
  'East Indian',
  'Middle Eastern',
  'Mixed',
  'Native American',
  'Pacific Islander',
  'White / Caucasian',
  'Other',
];

const Ethnicity = () => {
  // const [ethnicity, setEthnicity] = useState<string[]>([]);

  const {ethnicity, setEthnicity} = useContext(AppContext)


  const toggleOption = (option: string): void => {
    if (ethnicity.includes(option)) {
      setEthnicity(ethnicity.filter((item: string) => item !== option));
    } else {
      setEthnicity([...ethnicity, option]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Ethnicity</Text>
      <View style={styles.optionsWrapper}>
        {ethnicityOptions.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.option,
              ethnicity.includes(item) && styles.optionSelected,
            ]}
            onPress={() => toggleOption(item)}
          >
            <Text
              style={[
                styles.optionText,
                ethnicity.includes(item) && styles.optionTextSelected,
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
    gap: 10, // Use only on RN >= 0.71
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

export default Ethnicity;
