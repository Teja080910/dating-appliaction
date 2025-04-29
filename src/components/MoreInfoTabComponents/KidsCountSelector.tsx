import React, { useContext, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';

const OPTIONS = ['0', '1', '2', '3+', "I don't want to say."];

const KidsCountSelector = () => {
  // const [selectedKidCount, setSelectedKidCount] = useState<string | null>('');

  const {selectedKidCount, setSelectedKidCount} = useContext(AppContext);

  const toggleSelect = (item: string) => {
    setSelectedKidCount(prev => (prev === item ? null : item));
  };

  return (
    <View style={styles.section}>
      {/* <Text style={styles.label}>👶 How many kids:</Text> */}
      <Text style={styles.label}>How many kids:</Text>
      <View style={styles.optionsContainer}>
        {OPTIONS.map(option => (
          <Pressable
            key={option}
            onPress={() => toggleSelect(option)}
            style={[
              styles.option,
              selectedKidCount === option && styles.selectedOption
            ]}
          >
            <Text style={[
              styles.optionText,
              selectedKidCount === option && styles.selectedText
            ]}>
              {option}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: { 
    marginVertical: 20, 
    paddingHorizontal: 16 
  },
  label: { 
    fontSize: 16, 
    fontWeight: '600', 
    marginBottom: 12 
  },
  optionsContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 10 
  },
  option: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 18,
    backgroundColor: '#f9f9f9',
  },
  selectedOption: {
    backgroundColor: '#d9534f',
    borderColor: '#d9534f',
  },
  optionText: {
    color: '#333',
    fontSize: 14,
  },
  selectedText: {
    color: '#fff',
  }
});

export default KidsCountSelector;
