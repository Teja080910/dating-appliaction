import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';

const options = [
  '0-49k',
  '50k to 249k',
  '250-999k',
  '1 Million-5 Million',
  '5 Million+',
  "I don't want to say",
];

const NetWorthSelector = () => {
  // const [selected, setSelected] = useState<string | null>(null);

  const {selectedNetWorth, setSelectedNetWorth} = useContext(AppContext);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Net worth in USD</Text>
      <View style={styles.optionContainer}>
        {options.map(option => (
          <TouchableOpacity
            key={option}
            onPress={() =>
              setSelectedNetWorth(prev => (prev === option ? null : option))
            }
            style={[
              styles.option,
              selectedNetWorth === option && styles.selectedOption,
            ]}
          >
            <Text
              style={[
                styles.optionText,
                selectedNetWorth === option && styles.selectedText,
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

export default NetWorthSelector;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  title: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 12,
  },
  optionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  option: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 25,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
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
