import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';

const options = [
  'Hookup',
  'Casual AMARA',
  'Relationship',
  'Marriage',
  'Online relationship',
];

interface LookingForProps {
  onChange?: (val: string[]) => void;
}

const LookingFor: React.FC<LookingForProps> = ({ onChange }) => {
  const { lookingFor, setLookingFor } = useContext(AppContext);

  const toggleOption = (option: string) => {
    let nextLookingFor;
    if (lookingFor.includes(option)) {
      nextLookingFor = lookingFor.filter((item: string) => item !== option);
    } else {
      nextLookingFor = [...lookingFor, option];
    }
    setLookingFor(nextLookingFor);
    if (onChange) {
      onChange(nextLookingFor);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Looking for</Text>
      <View style={styles.optionsWrapper}>
        {options.map((item: string, index) => (
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
