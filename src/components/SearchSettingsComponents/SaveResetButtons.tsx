import React, { useContext } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AppContext from '../../context/CreateGlobalStateContext';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Shadows } from '../../theme';

interface SaveResetButtonsProps {
  onSave?: () => void;
  onReset?: () => void;
  saving?: boolean;
}

const SaveResetButtons: React.FC<SaveResetButtonsProps> = ({ onSave, onReset, saving }) => {
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
          colors={[Colors.primary, Colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.saveGradient}
        >
          {saving ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Spacing.radiusXl,
    marginHorizontal: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  resetButton: {
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  saveButton: {
    overflow: 'hidden',
    ...Shadows.md,
  },
  saveGradient: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Spacing.radiusXl,
  },
  resetButtonText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default SaveResetButtons;
