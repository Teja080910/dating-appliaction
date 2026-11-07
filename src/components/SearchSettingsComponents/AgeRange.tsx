import React, { useContext, useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, LayoutChangeEvent, useWindowDimensions } from 'react-native';
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
  const { width: windowWidth } = useWindowDimensions();
  const computeSliderWidth = (w: number) => Math.max(180, Math.round(w - 32 - 24));
  const [sliderWidth, setSliderWidth] = useState<number>(() => computeSliderWidth(windowWidth));

  useEffect(() => {
    setSliderWidth(computeSliderWidth(windowWidth));
  }, [windowWidth]);

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
      setSliderWidth(Math.max(180, Math.round(availableWidth - 24)));
    }
  };

  return (
    <View style={styles.container}>
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

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginTop: 24,
      padding: 0,
      backgroundColor: 'transparent',
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
      letterSpacing: -0.1,
    },
    valueText: {
      fontSize: 15,
      fontWeight: '500',
      color: themeColors.textSecondary,
    },
    sliderWrapper: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 4,
    },
    selectedTrack: {
      backgroundColor: themeColors.primary,
    },
    unselectedTrack: {
      backgroundColor: themeColors.surfaceLight,
    },
    marker: {
      height: 24,
      width: 24,
      borderRadius: 12,
      borderWidth: 3,
      borderColor: themeColors.primary,
      backgroundColor: '#FFFFFF',
      ...Platform.select({
        ios: {
          shadowColor: themeColors.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.35,
          shadowRadius: 3,
        },
        android: { elevation: 3 },
      }),
    },
    markerPressed: {
      height: 28,
      width: 28,
      borderRadius: 14,
    },
    sliderContainer: {
      height: 40,
      justifyContent: 'center',
    },
    track: {
      height: 4,
      borderRadius: 2,
    },
  });

export default AgeRangeSlider;
