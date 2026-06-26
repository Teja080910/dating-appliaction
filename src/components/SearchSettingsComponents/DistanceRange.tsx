import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import AppContext from '../../context/CreateGlobalStateContext';
import { Colors, Spacing } from '../../theme';

interface DistanceSliderProps {
  onChange?: (val: number) => void;
}

const DistanceSlider: React.FC<DistanceSliderProps> = ({ onChange }) => {
  const { distanceRange } = useContext(AppContext);
  const [localDistanceRange, setLocalDistanceRange] = useState(distanceRange || 50);

  const handleValueChange = (val: number) => {
    setLocalDistanceRange(val);
    if (onChange) onChange(val);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Distance Range: <Text style={styles.value}>{localDistanceRange} km</Text>
      </Text>

      <Slider
        style={styles.slider}
        minimumValue={5}
        maximumValue={2000}
        step={5}
        value={localDistanceRange}
        onValueChange={handleValueChange}
        minimumTrackTintColor={Colors.primary}
        maximumTrackTintColor={Colors.surfaceLight}
        thumbTintColor={Colors.primary}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.screenPaddingHorizontal,
    marginTop: Spacing.lg,
    borderRadius: Spacing.radiusXl,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  label: {
    fontSize: 15,
    marginBottom: Spacing.lg,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  value: {
    fontWeight: '700',
    color: Colors.text,
  },
  slider: {
    width: '100%',
    height: 40,
    marginLeft: -10,
  },
});

export default DistanceSlider;
