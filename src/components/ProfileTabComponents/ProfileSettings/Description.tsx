import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Colors, useTheme } from '../../../theme';
import { t, useTranslation } from '../../../i18n';

const MAX_LENGTH = 150;

interface DescriptionProps {
  value: string;
  onChange: (val: string) => void;
}

const DescriptionInput: React.FC<DescriptionProps> = ({ value, onChange }) => {
  useTranslation();
  const { themeColors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.prompt, { color: themeColors.textSecondary }]}>{t('profile.description.tell_us_something_about_yourself_you_can_write_about_your_hobbies_valu')}</Text>

      <View
        style={[
          styles.inputCard,
          {
            backgroundColor: themeColors.surfaceLight,
            borderColor: themeColors.borderLight,
          },
        ]}
      >
        <TextInput
          style={[styles.input, { color: themeColors.text }]}
          value={value}
          onChangeText={onChange}
          placeholder={t('profile.description.tell_us_about_yourself')}
          placeholderTextColor={themeColors.textMuted}
          multiline
          maxLength={MAX_LENGTH}
        />
      </View>

      <Text style={[styles.charCount, { color: themeColors.textSecondary }]}>
        {value?.length || 0} / {MAX_LENGTH}
      </Text>
    </View>
  );
};

export default DescriptionInput;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 22,
  },
  prompt: {
    fontSize: 14.5,
    lineHeight: 20,
    marginBottom: 12,
  },
  inputCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    minHeight: 120,
  },
  input: {
    fontSize: 15,
    fontWeight: '400',
    textAlignVertical: 'top',
    padding: 0,
    minHeight: 92,
  },
  charCount: {
    marginTop: 6,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '500',
  },
});
