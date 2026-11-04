import React, { useContext, useMemo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import AppContext from '../../context/CreateGlobalStateContext';
import { useNavigation } from '@react-navigation/native';
import { useTheme, ThemeColors, Spacing, Shadows } from '../../theme';
import { t, useTranslation } from '../../i18n';

interface SaveResetButtonsProps {
  onSave?: () => void;
  onReset?: () => void;
  saving?: boolean;
}

const SaveResetButtons: React.FC<SaveResetButtonsProps> = ({ onSave, onReset, saving }) => {
  useTranslation();
  const { themeColors } = useTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {
    setAgeRange, setLocation, setDistanceRange, setBodyHeight,
    setSearchLanguages, setSelectedOptions, setSelectBodyTypes,
    setEnglishProficiency, setEthnicity, setLookingFor, setShowMe, setSmoke,
  } = useContext(AppContext);

  const handleSave = () => {
    if (onSave) onSave();
    else navigation.goBack();
  };

  const handleReset = () => {
    if (onReset) onReset();
    else {
      setAgeRange([18, 55]);
      setLocation(t('search.location.my_current_location'));
      setDistanceRange(1100);
      setBodyHeight([120, 200]);
      setSearchLanguages([]);
      setSelectedOptions([]);
      setSelectBodyTypes([]);
      setEnglishProficiency([]);
      setEthnicity([]);
      setLookingFor([]);
      setShowMe(null);
      setSmoke([]);
    }
  };

  // Ensure buttons sit safely above the navigation bar / gesture bar on all devices
  const bottomInset = insets.bottom > 0
    ? insets.bottom + Spacing.sm
    : (Platform.OS === 'android' ? 24 : Spacing.lg);

  return (
    <View style={[styles.container, { paddingBottom: bottomInset }]}>
      <TouchableOpacity
        style={[styles.button, styles.resetButton]}
        onPress={handleReset}
        disabled={saving}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.resetButtonText}>{t('search.saveresetbuttons.reset')}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.saveButton]}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.8}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <LinearGradient
          colors={[themeColors.primary, themeColors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.saveGradient}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>{t('more_info.savebutton.save')}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.screenPaddingHorizontal,
      paddingTop: Spacing.md,
      backgroundColor: themeColors.surface,
      borderTopWidth: 1,
      borderTopColor: themeColors.borderLight,
    },
    button: {
      paddingVertical: 0,
      borderRadius: Spacing.radiusXl,
      marginHorizontal: Spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      height: Spacing.buttonHeight,
    },
    resetButton: {
      backgroundColor: themeColors.surfaceLight,
      borderWidth: 1,
      borderColor: themeColors.borderLight,
      flex: 1,
    },
    saveButton: {
      overflow: 'hidden',
      ...Shadows.md,
      flex: 1,
    },
    saveGradient: {
      flex: 1,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: Spacing.radiusXl,
    },
    resetButtonText: {
      color: themeColors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },
  });

export default SaveResetButtons;
