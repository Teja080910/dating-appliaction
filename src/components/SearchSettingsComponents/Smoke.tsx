import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';
import { Colors, Spacing } from '../../theme';

const options = ['Yes', 'No', 'Sometimes'];

interface SmokeProps {
  onChange?: (val: boolean) => void;
}

const Smoke: React.FC<SmokeProps> = ({ onChange }) => {
  const { smoke, setSmoke } = useContext(AppContext);

  const toggleOption = (option: string) => {
    const nextSmoke = smoke.includes(option)
      ? smoke.filter((item: string) => item !== option)
      : [...smoke, option];
    setSmoke(nextSmoke);
    if (onChange) {
      onChange(nextSmoke.includes('Yes') || nextSmoke.includes('Sometimes'));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Smoker?</Text>
      <View style={styles.optionsWrapper}>
        {options.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.option, smoke.includes(item) && styles.optionSelected]}
            onPress={() => toggleOption(item)}
          >
            <Text style={[styles.optionText, smoke.includes(item) && styles.optionTextSelected]}>
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

export default Smoke;
