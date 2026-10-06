import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppContext from '../../context/CreateGlobalStateContext';
import { Colors, useTheme } from '../../theme';

const HeightSelector = () => {
  const { themeColors, isDark } = useTheme();
  const { height, setHeight, tempHeight, setTempHeight } = useContext(AppContext);
  const currentHeight = Number(tempHeight || height || 171);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Icon name="ruler" size={22} color={themeColors.text} style={styles.headerIcon} />
        <View style={styles.textColumn}>
          <Text style={[styles.title, { color: themeColors.text }]}>Your height</Text>
          <Text style={[styles.valueText, { color: themeColors.textSecondary }]}>{currentHeight} cm</Text>
        </View>
      </View>
      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          minimumValue={120}
          maximumValue={220}
          step={1}
          minimumTrackTintColor={themeColors.primary}
          maximumTrackTintColor={isDark ? 'rgba(255, 255, 255, 0.18)' : '#E5E7EB'}
          thumbTintColor={themeColors.primaryLight}
          value={currentHeight}
          onValueChange={(value) => setTempHeight(Math.round(value))}
          onSlidingComplete={(value) => {
            const rounded = Math.round(value);
            setTempHeight(rounded);
            setHeight(rounded);
          }}
        />
      </View>
    </View>
  );
};

export default HeightSelector;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  headerIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  textColumn: {
    flexDirection: 'column',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  valueText: {
    fontSize: 14.5,
    marginTop: 3,
    fontWeight: '500',
  },
  sliderContainer: {
    width: '100%',
    paddingVertical: 2,
  },
  slider: {
    width: '100%',
    height: 40,
  },
});


