import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { englishLevels } from '../../utils/types/englishLevels';
import AppContext from '../../context/CreateGlobalStateContext';
import { Colors, Spacing } from '../../theme';

const EnglishSkillSelector = () => {
  const { englishSkillLevel, setEnglishSkillLevel } = useContext(AppContext);
  const [localValue, setLocalValue] = useState(englishSkillLevel);

  useEffect(() => {
    setLocalValue(englishSkillLevel);
  }, [englishSkillLevel]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        How good is your English: <Text style={styles.levelText}>{englishLevels[localValue]}</Text>
      </Text>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={3}
        step={1}
        minimumTrackTintColor={Colors.primary}
        maximumTrackTintColor={Colors.surfaceLighter}
        thumbTintColor={Colors.primary}
        value={localValue}
        onValueChange={(value) => setLocalValue(value)}
        onSlidingComplete={(value) => setEnglishSkillLevel(value)}
      />
    </View>
  );
};

export default EnglishSkillSelector;

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
  levelText: {
    fontWeight: 'bold',
    color: Colors.primary,
  },
  slider: {
    width: '100%',
    height: 40,
  },
});
