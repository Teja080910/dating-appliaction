import React, { useContext, useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getGender } from '../../utils/types/AsyncStorage';
import AppContext from '../../context/CreateGlobalStateContext';
import { useTheme, ThemeColors, Spacing } from '../../theme';
import { t, useTranslation } from '../../i18n';

interface ShowMeProps {
  onChange?: (val: string[]) => void;
}

const ShowMe: React.FC<ShowMeProps> = ({ onChange }) => {
  useTranslation();
  const { themeColors } = useTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const { showMe, setShowMe } = useContext(AppContext);
  const initialized = useRef(false);

  // By default (or if showMe is not set), only Women is selected
  const isBothSelected = showMe === 'both';
  const isMenSelected = isBothSelected || showMe === 'straight_man' || (showMe as any) === 'Male' || (showMe as any) === 'man';
  const isWomenSelected = isBothSelected || showMe === 'straight_woman' || (showMe as any) === 'Female' || (showMe as any) === 'woman' || !showMe;

  useEffect(() => {
    if (initialized.current) return;
    if (showMe) {
      const selectedGenders: string[] = [];
      if (isWomenSelected) selectedGenders.push('Female');
      if (isMenSelected) selectedGenders.push('Male');
      if (onChange) onChange(selectedGenders.length > 0 ? selectedGenders : ['Female']);
      initialized.current = true;
      return;
    }
    // Default search filter is Women only
    setShowMe('straight_woman');
    if (onChange) onChange(['Female']);
    initialized.current = true;
  }, [showMe]);

  const toggleWomen = () => {
    if (isWomenSelected) {
      // If Men is also selected, deselecting Women leaves Men only
      if (isMenSelected) {
        setShowMe('straight_man');
        if (onChange) onChange(['Male']);
      }
      // If Men is not selected, keep Women selected (at least one must be active)
    } else {
      if (isMenSelected) {
        // Both are now selected
        setShowMe('both');
        if (onChange) onChange(['Female', 'Male']);
      } else {
        setShowMe('straight_woman');
        if (onChange) onChange(['Female']);
      }
    }
  };

  const toggleMen = () => {
    if (isMenSelected) {
      // If Women is also selected, deselecting Men leaves Women only
      if (isWomenSelected) {
        setShowMe('straight_woman');
        if (onChange) onChange(['Female']);
      }
      // If Women is not selected, keep Men selected (at least one must be active)
    } else {
      if (isWomenSelected) {
        // Both are now selected
        setShowMe('both');
        if (onChange) onChange(['Female', 'Male']);
      } else {
        setShowMe('straight_man');
        if (onChange) onChange(['Male']);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('search.showme.show_me')}</Text>
      <View style={styles.buttonGroup}>
        <TouchableOpacity
          testID="show-me-women"
          style={[styles.button, isWomenSelected && styles.selectedButton]}
          onPress={toggleWomen}
          activeOpacity={0.7}
        >
          <Text style={[styles.buttonText, isWomenSelected && styles.selectedText]}>{t('search.showme.women')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="show-me-men"
          style={[styles.button, isMenSelected && styles.selectedButton]}
          onPress={toggleMen}
          activeOpacity={0.7}
        >
          <Text style={[styles.buttonText, isMenSelected && styles.selectedText]}>{t('search.showme.men')}</Text>
        </TouchableOpacity>
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
      fontSize: 16,
      marginBottom: Spacing.md,
      fontWeight: '700',
      color: themeColors.text,
      letterSpacing: 0.1,
    },
    buttonGroup: {
      flexDirection: 'row',
    },
    button: {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xl,
      borderRadius: Spacing.radiusFull,
      borderWidth: 1.5,
      borderColor: themeColors.borderLight,
      backgroundColor: themeColors.surfaceLight,
      marginRight: Spacing.md,
    },
    selectedButton: {
      backgroundColor: themeColors.primary,
      borderColor: themeColors.primary,
    },
    buttonText: {
      color: themeColors.text,
      fontSize: 14,
      fontWeight: '600',
    },
    selectedText: {
      color: '#FFFFFF',
    },
  });

export default ShowMe;
