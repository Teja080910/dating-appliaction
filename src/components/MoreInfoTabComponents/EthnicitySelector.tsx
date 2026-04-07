import React, {useContext} from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';

const ETHNICITIES = [
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

const EthnicitySelector = () => {
  // const [selectedEthinicity, setSelectedEthinicity] = useState<string | null>('Asian');

  const {selectedEthinicity, setSelectedEthinicity} = useContext(AppContext);
  const toggleSelect = (item: string) => {
    setSelectedEthinicity((prev: string | null) => (prev === item ? null : item));
  };

  return (
    <View style={styles.section}>
      {/* <Text style={styles.label}>🧬 Your ethnicity</Text> */}
      <Text style={styles.label}>Your ethnicity</Text>
      <View style={styles.optionsContainer}>
        {ETHNICITIES.map(item => (
          <Pressable
            key={item}
            style={[styles.option, selectedEthinicity === item && styles.selectedOption]}
            onPress={() => toggleSelect(item)}>
            <Text
              style={[
                styles.optionText,
                selectedEthinicity === item && styles.selectedText,
              ]}>
              {item}
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
    paddingHorizontal: 16,
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
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 14,
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
  },
});

export default EthnicitySelector;
