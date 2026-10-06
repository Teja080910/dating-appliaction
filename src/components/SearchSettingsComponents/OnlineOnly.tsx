import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckBox } from 'react-native-elements';
import { useTheme, ThemeColors, Spacing } from '../../theme';

interface OnlineOnlyProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

const OnlineOnly: React.FC<OnlineOnlyProps> = ({ value, onChange }) => {
  const { themeColors } = useTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => onChange(!value)} activeOpacity={0.7} style={styles.row}>
        <CheckBox
          checked={value}
          onPress={() => onChange(!value)}
          checkedColor={themeColors.primary}
          containerStyle={styles.checkbox}
        />
        <Text style={styles.label}>Show active users only</Text>
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
    row: { flexDirection: 'row', alignItems: 'center' },
    checkbox: { padding: 0, margin: 0, marginRight: Spacing.sm, backgroundColor: 'transparent', borderWidth: 0 },
    label: { fontSize: 16, color: themeColors.text, fontWeight: '500' },
  });

export default OnlineOnly;
