import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme, ThemeColors } from '../../theme';

interface Props {
  onClose: () => void;
}

const SearchSettingsHeader = ({ onClose }: Props) => {
  const { themeColors } = useTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity
        onPress={onClose}
        style={styles.backButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.7}
      >
        <Icon name="chevron-left" size={26} color={themeColors.text} />
      </TouchableOpacity>
      <Text style={styles.title}>Search Settings</Text>
    </View>
  );
};

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: themeColors.background,
    },
    backButton: {
      paddingRight: 10,
      paddingVertical: 4,
    },
    title: {
      fontSize: 20,
      fontWeight: '800',
      color: themeColors.text,
      letterSpacing: -0.2,
    },
  });

export default SearchSettingsHeader;

