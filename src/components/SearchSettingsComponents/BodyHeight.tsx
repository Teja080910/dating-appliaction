import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import AppContext from '../../context/CreateGlobalStateContext';
import { Colors, Spacing } from '../../theme';

interface BodyHeightProps {
  onChange?: (min: number, max: number) => void;
}

const BodyHeight: React.FC<BodyHeightProps> = ({ onChange }) => {
  const { bodyHeight } = useContext(AppContext);
  const [localBodyHeight, setLocalBodyHeight] = useState(bodyHeight || [120, 200]);

  const handleValuesChange = (values: number[]) => {
    setLocalBodyHeight(values);
    if (onChange) onChange(values[0], values[1]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Body height: <Text style={styles.value}>{localBodyHeight[0]} cm - {localBodyHeight[1]} cm</Text>
      </Text>

      <MultiSlider
        values={localBodyHeight}
        sliderLength={330}
        min={120}
        max={200}
        onValuesChange={handleValuesChange}
        step={1}
        selectedStyle={{ backgroundColor: Colors.primary }}
        unselectedStyle={{ backgroundColor: Colors.surfaceLight }}
        markerStyle={styles.marker}
        containerStyle={styles.sliderContainer}
        trackStyle={styles.track}
      />
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
    fontSize: 15,
    marginBottom: Spacing.lg,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  value: {
    fontWeight: '700',
    color: Colors.text,
  },
  marker: {
    height: 26,
    width: 26,
    borderRadius: 13,
    borderWidth: 3,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
    }),
  },
  sliderContainer: {
    marginLeft: 10,
    height: 40,
  },
  track: {
    height: 4,
    borderRadius: 2,
  },
});

export default BodyHeight;
