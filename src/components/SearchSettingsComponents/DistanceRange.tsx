import React, { useContext, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Platform, LayoutChangeEvent, TouchableOpacity } from 'react-native';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import Feather from 'react-native-vector-icons/Feather';
import AppContext from '../../context/CreateGlobalStateContext';
import { useTheme, ThemeColors, Spacing } from '../../theme';
import { t, useTranslation } from '../../i18n';

interface DistanceSliderProps {
  onChange?: (val: number) => void;
  onWorldwideToggle?: (val: boolean) => void;
}

const DistanceSlider: React.FC<DistanceSliderProps> = ({ onChange, onWorldwideToggle }) => {
  useTranslation();
  const { themeColors } = useTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const { distanceRange, setDistanceRange, isChecked, setIsChecked, isSubscribed, setPaywallVisible } = useContext(AppContext);
  const [sliderWidth, setSliderWidth] = useState(260);

  const currentDistance = Math.min(Math.max(Number(distanceRange) || 50, 5), 200);

  const handleValueChange = (values: number[]) => {
    const rounded = Math.round(values[0]);
    setDistanceRange(rounded);
    if (isChecked) {
      setIsChecked(false);
      if (onWorldwideToggle) onWorldwideToggle(false);
    }
    if (onChange) onChange(rounded);
  };

  const handleToggleWorldwide = () => {
    if (!isSubscribed) {
      setPaywallVisible(true);
      return;
    }
    const newVal = !isChecked;
    setIsChecked(newVal);
    if (onWorldwideToggle) onWorldwideToggle(newVal);
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    const availableWidth = event.nativeEvent.layout.width;
    if (availableWidth > 60) {
      setSliderWidth(Math.max(180, availableWidth - 28));
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Row: "Search radius" on left, "200 km" or "Worldwide" on right */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t('search.distancerange.search_radius')}</Text>
        <Text style={styles.valueText}>
          {isChecked ? t('search.distancerange.worldwide') : t('search.distancerange.km', { currentDistance })}
        </Text>
      </View>

      {/* MultiSlider container */}
      <View style={styles.sliderWrapper} onLayout={handleLayout}>
        <MultiSlider
          values={[currentDistance]}
          sliderLength={sliderWidth}
          min={5}
          max={200}
          step={1}
          onValuesChange={handleValueChange}
          snapped
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

      {/* Footer Row: "5 km" on left, "🌐 Worldwide" on right */}
      <View style={styles.footerRow}>
        <Text style={styles.minLabel}>{t('search.distancerange.5_km')}</Text>
        <TouchableOpacity
          style={[styles.worldwideBtn, isChecked && styles.worldwideBtnActive]}
          onPress={handleToggleWorldwide}
          activeOpacity={0.7}
        >
          <Feather
            name="globe"
            size={14}
            color={isChecked ? themeColors.primary : themeColors.textSecondary}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.worldwideText, isChecked && styles.worldwideTextActive]}>{t('search.distancerange.worldwide')}</Text>
        </TouchableOpacity>
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
      marginVertical: 4,
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
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
        },
        android: { elevation: 4 },
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
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: Spacing.xs,
    },
    minLabel: {
      fontSize: 13,
      color: themeColors.textSecondary,
      fontWeight: '500',
    },
    worldwideBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 12,
    },
    worldwideBtnActive: {
      backgroundColor: 'rgba(124, 58, 237, 0.15)',
    },
    worldwideText: {
      fontSize: 13,
      color: themeColors.textSecondary,
      fontWeight: '500',
    },
    worldwideTextActive: {
      color: themeColors.primary,
      fontWeight: '700',
    },
  });

export default DistanceSlider;
