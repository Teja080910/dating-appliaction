import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../theme';
import { t, useTranslation } from '../../i18n';

interface SaveButtonProps {
  onPress?: () => void;
  loading?: boolean;
}

const SaveButton: React.FC<SaveButtonProps> = ({ onPress, loading }) => {
  useTranslation();
  const { themeColors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={loading}
      style={[styles.button, loading && { opacity: 0.7 }]}
    >
      <LinearGradient
        colors={[themeColors.primary, themeColors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.text}>{t('more_info.savebutton.save')}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default SaveButton;

const styles = StyleSheet.create({
  button: {
    width: '100%',
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  gradient: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
