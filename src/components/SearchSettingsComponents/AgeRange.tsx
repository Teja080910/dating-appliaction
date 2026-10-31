import React, { useContext, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Platform, LayoutChangeEvent } from 'react-native';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import AppContext from '../../context/CreateGlobalStateContext';
import { useTheme, ThemeColors, Spacing } from '../../theme';
import { t, useTranslation } from '../../i18n';

interface AgeRangeSliderProps {
  onChange?: (min: number, max: number) => void;
}

const AgeRangeSlider: React.FC<AgeRangeSliderProps> = ({ onChange }) => {
  useTranslation();
  const { themeColors } = useTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const { ageRange, setAgeRange } = useContext(AppContext);
  const [sliderWidth, setSliderWidth] = useState<number>(260);

  const safeMin = Math.min(Math.max(ageRange?.[0] ?? 18, 18), 55);
  const safeMax = Math.min(Math.max(ageRange?.[1] ?? 40, safeMin), 55);
  const currentValues = [safeMin, safeMax];

  const handleValuesChange = (values: number[]) => {
    const min = Math.round(values[0]);
    const max = Math.round(values[1]);
    setAgeRange([min, max]);
    if (onChange) onChange(min, max);
  };

  const handleLayout = (e: LayoutChangeEvent) => {
    const availableWidth = e.nativeEvent.layout.width;
    if (availableWidth > 60) {
      // sliderLength is the distance between the marker centres. Keep the
      // markers inside the measured content area and avoid a fixed 300px bar.
      setSliderWidth(Math.max(180, availableWidth - 26));
    }
  };

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t('search.agerange.age_range')}</Text>
        <Text style={styles.valueText}>
          {currentValues[0]} – {currentValues[1]}{currentValues[1] === 55 ? '+' : ''}
        </Text>
      </View>

      <View style={styles.sliderWrapper} onLayout={handleLayout}>
        <MultiSlider
          values={currentValues}
          sliderLength={sliderWidth}
          onValuesChange={handleValuesChange}
          min={18}
          max={55}
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
          selectedStyle={{ backgroundColor: themeColors.primary }}
          unselectedStyle={{ backgroundColor: themeColors.surfaceLight }}
          markerStyle={styles.marker}
          pressedMarkerStyle={styles.markerPressed}
          containerStyle={styles.sliderContainer}
          trackStyle={styles.track}
        />
      </View>
    </View>
  );
};

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.lg,
      backgroundColor: themeColors.surface,
      marginHorizontal: Spacing.screenPaddingHorizontal,
      marginTop: Spacing.lg,
      borderRadius: Spacing.radiusXl,
      borderWidth: 1,
      borderColor: themeColors.borderLight,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: themeColors.text,
      letterSpacing: 0.1,
    },
    valueText: {
      fontSize: 15,
      fontWeight: '600',
      color: themeColors.textSecondary,
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
      borderColor: themeColors.primary,
      backgroundColor: '#FFFFFF',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
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

export default AgeRangeSlider;
