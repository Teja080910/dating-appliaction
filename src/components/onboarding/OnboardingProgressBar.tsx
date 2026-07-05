import React from 'react';
import { View, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, radius } from '../../constants/theme';

const OnboardingProgressBar = ({ percent }: { percent: number }) => {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.fill, { width: `${clamped}%` }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 5,
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginBottom: 24,
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
});

export default OnboardingProgressBar;
