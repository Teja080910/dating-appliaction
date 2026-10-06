import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, Platform, LayoutChangeEvent } from 'react-native';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import AppContext from '../../context/CreateGlobalStateContext';
import { Colors, Spacing } from '../../theme';

interface DistanceSliderProps {
  onChange?: (val: number) => void;
}

const DistanceSlider: React.FC<DistanceSliderProps> = ({ onChange }) => {
  const { distanceRange, setDistanceRange } = useContext(AppContext);
  const [sliderWidth, setSliderWidth] = useState(260);
  const currentDistance = Math.min(Math.max(Number(distanceRange) || 50, 5), 100);

  const handleValueChange = (values: number[]) => {
    const rounded = Math.round(values[0]);
    setDistanceRange(rounded);
    if (onChange) onChange(rounded);
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    const availableWidth = event.nativeEvent.layout.width;
    if (availableWidth > 60) {
      setSliderWidth(Math.max(180, availableWidth - 26));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Search radius: <Text style={styles.value}>{currentDistance} km</Text>
      </Text>

      <View style={styles.sliderWrapper} onLayout={handleLayout}>
        <MultiSlider
          values={[currentDistance]}
          sliderLength={sliderWidth}
          min={5}
          max={100}
          step={1}
          onValuesChange={handleValueChange}
          snapped
          touchDimensions={{
            height: 50,
            width: 50,
            borderRadius: 25,
            slipDisplacement: 200,
          }}
          selectedStyle={styles.selectedTrack}
          unselectedStyle={styles.unselectedTrack}
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
  sliderWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTrack: {
    backgroundColor: Colors.primary,
  },
  unselectedTrack: {
    backgroundColor: Colors.surfaceLight,
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

export default DistanceSlider;
