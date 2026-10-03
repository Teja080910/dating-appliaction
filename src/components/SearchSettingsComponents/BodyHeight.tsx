import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, Platform, LayoutChangeEvent } from 'react-native';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import AppContext from '../../context/CreateGlobalStateContext';
import { Colors, Spacing } from '../../theme';

interface BodyHeightProps {
  onChange?: (min: number, max: number) => void;
}

const BodyHeight: React.FC<BodyHeightProps> = ({ onChange }) => {
  const { bodyHeight, setBodyHeight } = useContext(AppContext);
  const [sliderWidth, setSliderWidth] = useState<number>(260);

  const safeMin = Math.min(Math.max(bodyHeight?.[0] ?? 120, 120), 200);
  const safeMax = Math.min(Math.max(bodyHeight?.[1] ?? 200, safeMin), 200);
  const currentValues = [safeMin, safeMax];

  const handleValuesChange = (values: number[]) => {
    const min = Math.round(values[0]);
    const max = Math.round(values[1]);
    setBodyHeight([min, max]);
    if (onChange) onChange(min, max);
  };

  const handleLayout = (e: LayoutChangeEvent) => {
    const availableWidth = e.nativeEvent.layout.width;
    if (availableWidth > 60) {
      setSliderWidth(Math.max(180, availableWidth - 26));
    }
  };

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <Text style={styles.label}>
        Height range: <Text style={styles.value}>{currentValues[0]} cm - {currentValues[1]} cm</Text>
      </Text>

      <View style={styles.sliderWrapper} onLayout={handleLayout}>
        <MultiSlider
          values={currentValues}
          sliderLength={sliderWidth}
          min={120}
          max={200}
          onValuesChange={handleValuesChange}
          step={1}
          allowOverlap={false}
          minMarkerOverlapDistance={1}
          snapped={true}
          touchDimensions={{
            height: 50,
            width: 50,
            borderRadius: 25,
            slipDisplacement: 200,
          }}
          selectedStyle={{ backgroundColor: Colors.primary }}
          unselectedStyle={{ backgroundColor: Colors.surfaceLight }}
          markerStyle={styles.marker}
          pressedMarkerStyle={styles.markerPressed}
          containerStyle={styles.sliderContainer}
          trackStyle={styles.track}
        />
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
    fontSize: 15,
    marginBottom: Spacing.lg,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  value: {
    fontWeight: '700',
    color: Colors.text,
  },
  sliderWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
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
  markerPressed: {
    height: 30,
    width: 30,
    borderRadius: 15,
  },
  sliderContainer: {
    height: 48,
    justifyContent: 'center',
  },
  track: {
    height: 4,
    borderRadius: 2,
  },
});

export default BodyHeight;
