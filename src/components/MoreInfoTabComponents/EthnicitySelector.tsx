import React, {useContext, useState} from 'react';
import {View, Text, StyleSheet, Pressable, FlatList} from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';
import { colors, radius } from '../../constants/theme';

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
    setSelectedEthinicity(prev => (prev === item ? null : item));
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
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.surfaceAlt,
  },
  selectedOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    color: colors.ink,
    fontSize: 14,
  },
  selectedText: {
    color: colors.surface,
  },
});

export default EthnicitySelector;
