import React, { useContext, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';
import { useTheme, ThemeColors, Spacing } from '../../theme';
import { t, useTranslation } from '../../i18n';

const options = ['Hookup', 'Casual dating', 'Online relationship', 'Relationship', 'Marriage'];
const lookingForLabel = (val: string) =>
  val === 'Casual dating' ? t('profile.userdetails.casual_dating')
  : val === 'Relationship' ? t('profile.userdetails.relationship')
  : val;

interface LookingForProps {
  onChange?: (val: string[]) => void;
}

const LookingFor: React.FC<LookingForProps> = ({ onChange }) => {
  useTranslation();
  const { themeColors } = useTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const { lookingFor, setLookingFor } = useContext(AppContext);

  const toggleOption = (option: string) => {
    const nextLookingFor = lookingFor.includes(option)
      ? lookingFor.filter((item: string) => item !== option)
      : [...lookingFor, option];
    setLookingFor(nextLookingFor);
    if (onChange) onChange(nextLookingFor);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('more_info.lookingforselector.what_are_you_looking_for')}</Text>
      <View style={styles.optionsWrapper}>
        {options.map((item: string, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.option, lookingFor.includes(item) && styles.optionSelected]}
            onPress={() => toggleOption(item)}
          >
            <Text style={[styles.optionText, lookingFor.includes(item) && styles.optionTextSelected]}>
              {lookingForLabel(item)}
            </Text>
          </TouchableOpacity>
        ))}
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

export default LookingFor;
