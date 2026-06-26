import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../../../theme';

interface DisplayNameProps {
  value: string;
  onChange: (val: string) => void;
}

const DisplayName: React.FC<DisplayNameProps> = ({ value, onChange }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your display name</Text>
      <Text style={styles.subtitle}>You can write your real name or a nickname</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholderTextColor={Colors.textMuted}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  input: {
    backgroundColor: Colors.inputBackground,
    borderRadius: Spacing.radiusMd,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
});

export default DisplayName;
