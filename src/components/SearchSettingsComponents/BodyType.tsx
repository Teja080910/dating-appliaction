import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';
import { Colors, Spacing } from '../../theme';

const bodyTypes = ['Slim', 'Curvy', 'Athletic', 'Average', 'Overweight', 'Other'];

interface BodyTypeProps {
  onChange?: (val: string[]) => void;
}

const BodyType: React.FC<BodyTypeProps> = ({ onChange }) => {
  const { selectBodyTypes, setSelectBodyTypes } = useContext(AppContext);

  const toggleSelection = (type: string) => {
    const nextSelection = selectBodyTypes.includes(type)
      ? selectBodyTypes.filter((item: string) => item !== type)
      : [...selectBodyTypes, type];
    setSelectBodyTypes(nextSelection);
    if (onChange) onChange(nextSelection);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Body type</Text>
      <View style={styles.optionsWrapper}>
        {bodyTypes.map((type, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.option, selectBodyTypes.includes(type) && styles.optionSelected]}
            onPress={() => toggleSelection(type)}
          >
            <Text style={[styles.optionText, selectBodyTypes.includes(type) && styles.optionTextSelected]}>
              {type}
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

export default BodyType;
