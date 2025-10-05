import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';

const options = ['Yes', 'No', 'Sometimes'];

const Smoke = () => {
  // const [smoke, setSmoke] = useState<string[]>([]);

  const {smoke, setSmoke} = useContext(AppContext)

  const toggleOption = (option: string) => {
    if (smoke.includes(option)) {
      setSmoke(smoke.filter((item) => item !== option));
    } else {
      setSmoke([...smoke, option]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Smoker?</Text>
      <View style={styles.optionsWrapper}>
        {options.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.option,
              smoke.includes(item) && styles.optionSelected,
            ]}
            onPress={() => toggleOption(item)}
          >
            <Text
              style={[
                styles.optionText,
                smoke.includes(item) && styles.optionTextSelected,
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
    gap: 10, // For RN 0.71+, else use margin
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

export default Smoke;
