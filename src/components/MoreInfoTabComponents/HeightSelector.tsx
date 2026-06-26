import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import AppContext from '../../context/CreateGlobalStateContext';
import { Colors, Spacing } from '../../theme';

const HeightSelector = () => {
  const { height, setHeight, tempHeight, setTempHeight } = useContext(AppContext);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Your height: {tempHeight} cm</Text>
      <Slider
        style={styles.slider}
        minimumValue={120}
        maximumValue={200}
        step={1}
        minimumTrackTintColor={Colors.primary}
        maximumTrackTintColor={Colors.surfaceLighter}
        thumbTintColor={Colors.primary}
        value={height}
        onValueChange={(value) => setTempHeight(Math.round(value))}
        onSlidingComplete={(value) => setHeight(Math.round(value))}
      />
    </View>
  );
};

export default HeightSelector;

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
  slider: {
    width: '100%',
    height: 40,
  },
});
