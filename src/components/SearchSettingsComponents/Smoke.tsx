import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, ThemeColors, Spacing } from '../../theme';
import { t, useTranslation } from '../../i18n';

const values = ['Yes', 'No', 'Sometimes'];
const valueLabel = (val: string) =>
  val === 'Yes' ? t('profile.userdetails.yes')
  : val === 'No' ? t('profile.userdetails.no')
  : val === 'Sometimes' ? t('search.drinking.sometimes')
  : val;

interface SmokeProps {
  value?: string | boolean;
  onChange?: (val: string | undefined) => void;
}

const isOptionSelected = (currentVal: string | boolean | undefined, optionVal: string) => {
  if (currentVal === undefined || currentVal === null) return false;
  if (typeof currentVal === 'boolean') {
    if (optionVal === 'Yes') return currentVal === true;
    if (optionVal === 'No') return currentVal === false;
    return false;
  }
  return String(currentVal).toLowerCase() === optionVal.toLowerCase();
};

const Smoke: React.FC<SmokeProps> = ({ value, onChange }) => {
  useTranslation();
  const { themeColors } = useTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  const handlePress = (optVal: string) => {
    if (isOptionSelected(value, optVal)) {
      onChange?.(undefined);
    } else {
      onChange?.(optVal);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('search.smoke.smoker')}</Text>
      <View style={styles.optionsWrapper}>
        {values.map((item) => {
          const selected = isOptionSelected(value, item);
          return (
            <TouchableOpacity
              key={item}
              style={[styles.option, selected && styles.optionSelected]}
              onPress={() => handlePress(item)}
            >
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                {valueLabel(item)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    container: {
      padding: Spacing.xl,
      backgroundColor: themeColors.surface,
      marginHorizontal: Spacing.screenPaddingHorizontal,
      marginTop: Spacing.lg,
      borderRadius: Spacing.radiusXl,
      borderWidth: 1,
      borderColor: themeColors.borderLight,
    },
    label: {
      fontWeight: '700',
      fontSize: 16,
      marginBottom: Spacing.md,
      color: themeColors.text,
      letterSpacing: 0.1,
    },
    optionsWrapper: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    option: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderRadius: Spacing.radiusFull,
      borderWidth: 1,
      borderColor: themeColors.borderLight,
      backgroundColor: themeColors.surfaceLight,
      marginBottom: Spacing.sm,
    },
    optionSelected: {
      backgroundColor: themeColors.primary,
      borderColor: themeColors.primary,
    },
    optionText: {
      fontSize: 14,
      color: themeColors.text,
      fontWeight: '500',
    },
    optionTextSelected: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
  });

export default Smoke;
