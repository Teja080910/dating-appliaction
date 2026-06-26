import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';
import { Colors, Spacing } from '../../theme';

const bodyTypes = ['Slim', 'Muscular', 'Athletic', 'Average', 'Overweight', 'Other'];

const BodyTypeSelector = () => {
  const { selectedBodyType, setSelectedBodyType } = useContext(AppContext);

  const toggleBodyType = (type: string) => {
    if (selectedBodyType === type) {
      setSelectedBodyType(null);
    } else {
      setSelectedBodyType(type);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Your body type</Text>
      <View style={styles.optionsContainer}>
        {bodyTypes.map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.option, selectedBodyType === type && styles.optionSelected]}
            onPress={() => toggleBodyType(type)}
          >
            <Text style={[styles.optionText, selectedBodyType === type && styles.optionTextSelected]}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default BodyTypeSelector;

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
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: Colors.white,
    fontWeight: '600',
  },
});
