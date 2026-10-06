import React, { useContext, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckBox } from 'react-native-elements';
import AppContext from '../../context/CreateGlobalStateContext';
import { useTheme, ThemeColors, Spacing } from '../../theme';

interface SearchWorldWideProps {
  onToggle?: (val: boolean) => void;
}

const SearchWorldWide: React.FC<SearchWorldWideProps> = ({ onToggle }) => {
  const { themeColors } = useTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const { isChecked, setIsChecked, isSubscribed, setPaywallVisible } = useContext(AppContext);

  const handleToggle = () => {
    if (!isSubscribed) {
      setPaywallVisible(true);
      return;
    }
    const newVal = !isChecked;
    setIsChecked(newVal);
    if (onToggle) onToggle(newVal);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleToggle} activeOpacity={0.7} style={styles.checkRow}>
        <CheckBox
          checked={isChecked}
          onPress={handleToggle}
          checkedColor={themeColors.primary}
          containerStyle={styles.checkboxContainer}
        />
        <Text style={styles.label}>Search World Wide</Text>
      </TouchableOpacity>
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
    checkRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    checkboxContainer: {
      padding: 0,
      margin: 0,
      marginRight: Spacing.sm,
      backgroundColor: 'transparent',
      borderWidth: 0,
    },
    label: {
      fontSize: 16,
      color: themeColors.text,
      fontWeight: '500',
    },
  });

export default SearchWorldWide;
