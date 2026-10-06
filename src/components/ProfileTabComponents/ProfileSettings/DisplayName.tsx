import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Colors, useTheme } from '../../../theme';

interface DisplayNameProps {
  value: string;
  onChange: (val: string) => void;
}

const DisplayName: React.FC<DisplayNameProps> = ({ value, onChange }) => {
  const { themeColors } = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputCard,
          {
            backgroundColor: themeColors.surfaceLight,
            borderBottomColor: themeColors.borderLight,
          },
        ]}
      >
        <Text style={[styles.label, { color: themeColors.textSecondary }]}>Nickname / First name</Text>
        <TextInput
          style={[styles.input, { color: themeColors.text }]}
          value={value}
          onChangeText={onChange}
          placeholder="Enter nickname"
          placeholderTextColor={themeColors.textMuted}
        />
      </View>
    </View>
  );
};

export default DisplayName;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  inputCard: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1.5,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
  input: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
    padding: 0,
  },
});
