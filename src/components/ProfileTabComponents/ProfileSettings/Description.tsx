import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Colors, Spacing } from '../../../theme';

const MAX_LENGTH = 500;

interface DescriptionProps {
  value: string;
  onChange: (val: string) => void;
}

const DescriptionInput: React.FC<DescriptionProps> = ({ value, onChange }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your description</Text>
      <Text style={styles.subtitle}>
        Write about yourself: What's your profession?{'\n'}Which hobbies do you pursue?
      </Text>

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder="Write something..."
        placeholderTextColor={Colors.textMuted}
        multiline
        maxLength={MAX_LENGTH}
      />

      <Text style={styles.charCount}>{value?.length || 0} / {MAX_LENGTH}</Text>
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
    lineHeight: 22,
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
    textAlignVertical: 'top',
    minHeight: 100,
  },
  charCount: {
    marginTop: 8,
    textAlign: 'right',
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500',
  },
});

export default DescriptionInput;
