import React, { useContext, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';
import { useTheme, ThemeColors, Spacing } from '../../theme';
import { t, useTranslation } from '../../i18n';

const bodyTypes = ['Slim', 'Curvy', 'Muscular', 'Athletic', 'Average', 'A few extra pounds', 'Other'];
const bodyTypeLabel = (val: string) =>
  val === 'Slim' ? t('profile.userdetails.slim')
  : val === 'Other' ? t('profile.userdetails.other')
  : val;

interface BodyTypeProps {
  onChange?: (val: string[]) => void;
}

const BodyType: React.FC<BodyTypeProps> = ({ onChange }) => {
  useTranslation();
  const { themeColors } = useTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const { selectBodyTypes, setSelectBodyTypes } = useContext(AppContext);

  const toggleSelection = (type: string) => {
    const nextSelection = selectBodyTypes.includes(type)
      ? selectBodyTypes.filter((item: string) => item !== type)
      : [...selectBodyTypes, type];
    setSelectBodyTypes(nextSelection);
    if (onChange) onChange(nextSelection);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('search.bodytype.body_type')}</Text>
      <View style={styles.optionsWrapper}>
        {bodyTypes.map((type, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.option, selectBodyTypes.includes(type) && styles.optionSelected]}
            onPress={() => toggleSelection(type)}
          >
            <Text style={[styles.optionText, selectBodyTypes.includes(type) && styles.optionTextSelected]}>
              {bodyTypeLabel(type)}
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

export default BodyType;
