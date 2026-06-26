import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';
import { Colors, Spacing } from '../../theme';

const ethnicityOptions = [
  'Asian', 'Black / African Descent', 'Latin / Hispanic', 'East Indian',
  'Middle Eastern', 'Mixed', 'Native American', 'Pacific Islander',
  'White / Caucasian', 'Other',
];

interface EthnicityProps {
  onChange?: (val: string[]) => void;
}

const Ethnicity: React.FC<EthnicityProps> = ({ onChange }) => {
  const { ethnicity, setEthnicity } = useContext(AppContext);

  const toggleOption = (option: string): void => {
    const nextEthnicity = ethnicity.includes(option)
      ? ethnicity.filter((item: string) => item !== option)
      : [...ethnicity, option];
    setEthnicity(nextEthnicity);
    if (onChange) onChange(nextEthnicity);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Ethnicity</Text>
      <View style={styles.optionsWrapper}>
        {ethnicityOptions.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.option, ethnicity.includes(item) && styles.optionSelected]}
            onPress={() => toggleOption(item)}
          >
            <Text style={[styles.optionText, ethnicity.includes(item) && styles.optionTextSelected]}>
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
  optionsWrapper: {
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
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: Colors.white,
    fontWeight: '600',
  },
});

export default Ethnicity;
