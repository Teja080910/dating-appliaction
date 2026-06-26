import React, { useContext } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';
import { Colors, Spacing } from '../../theme';

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
  const { selectedEthinicity, setSelectedEthinicity } = useContext(AppContext);

  const toggleSelect = (item: string) => {
    setSelectedEthinicity((prev: string | null) => (prev === item ? null : item));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Your ethnicity</Text>
      <View style={styles.optionsContainer}>
        {ETHNICITIES.map(item => (
          <Pressable
            key={item}
            style={[styles.option, selectedEthinicity === item && styles.optionSelected]}
            onPress={() => toggleSelect(item)}
          >
            <Text style={[styles.optionText, selectedEthinicity === item && styles.optionTextSelected]}>
              {item}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.screenPaddingHorizontal,
    marginTop: Spacing.lg,
    borderRadius: Spacing.radiusXl,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  label: {
    fontWeight: '600',
    fontSize: 15,
    marginBottom: Spacing.md,
    color: Colors.textSecondary,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  option: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Spacing.radiusFull,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    backgroundColor: Colors.inputBackground,
    marginBottom: Spacing.sm,
  },
  optionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: Colors.white,
    fontWeight: '600',
  },
});

export default EthnicitySelector;
