import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckBox } from 'react-native-elements';
import { Colors, Spacing } from '../../theme';

interface OnlineOnlyProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

const OnlineOnly: React.FC<OnlineOnlyProps> = ({ value, onChange }) => (
  <View style={styles.container}>
    <TouchableOpacity onPress={() => onChange(!value)} activeOpacity={0.7} style={styles.row}>
      <CheckBox
        checked={value}
        onPress={() => onChange(!value)}
        checkedColor={Colors.primary}
        containerStyle={styles.checkbox}
      />
      <Text style={styles.label}>Show active users only</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.screenPaddingHorizontal,
    marginTop: Spacing.lg,
    borderRadius: Spacing.radiusXl,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  checkbox: { padding: 0, margin: 0, marginRight: Spacing.sm },
  label: { fontSize: 16, color: Colors.text, fontWeight: '500' },
});

export default OnlineOnly;
