import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';
import { Colors, Spacing } from '../../theme';

const appearances = ['Very attractive', 'Attractive', 'Average', 'Below Average'];

const AppearanceSelector = () => {
  const { selectedAppearance, setSelectedAppearance } = useContext(AppContext);

  const toggleAppearance = (appearance: string) => {
    if (selectedAppearance === appearance) {
      setSelectedAppearance(null);
    } else {
      setSelectedAppearance(appearance);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Your appearance</Text>
      <View style={styles.optionsContainer}>
        {appearances.map((appearance) => (
          <TouchableOpacity
            key={appearance}
            style={[styles.option, selectedAppearance === appearance && styles.optionSelected]}
            onPress={() => toggleAppearance(appearance)}
          >
            <Text style={[styles.optionText, selectedAppearance === appearance && styles.optionTextSelected]}>
              {appearance}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default AppearanceSelector;

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
