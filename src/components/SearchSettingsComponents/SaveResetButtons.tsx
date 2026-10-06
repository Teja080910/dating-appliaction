import React, { useContext, useMemo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AppContext from '../../context/CreateGlobalStateContext';
import { useNavigation } from '@react-navigation/native';
import { useTheme, ThemeColors, Spacing, Shadows } from '../../theme';

interface SaveResetButtonsProps {
  onSave?: () => void;
  onReset?: () => void;
  saving?: boolean;
}

const SaveResetButtons: React.FC<SaveResetButtonsProps> = ({ onSave, onReset, saving }) => {
  const { themeColors } = useTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const navigation = useNavigation();
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
      setLocation('My current location');
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

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, styles.resetButton]}
        onPress={handleReset}
        disabled={saving}
      >
        <Text style={styles.resetButtonText}>Reset</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.saveButton]}
        onPress={handleSave}
        disabled={saving}
      >
        <LinearGradient
          colors={[themeColors.primary, themeColors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.saveGradient}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
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
      paddingBottom: Spacing.lg,
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
