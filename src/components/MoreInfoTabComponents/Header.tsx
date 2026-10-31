import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { t, useTranslation } from '../../i18n';

const Header = () => {
  useTranslation();
  const { themeColors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Text style={[styles.title, { color: themeColors.text }]}>{t('more_info.header.about_me')}</Text>
      <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>{t('more_info.header.complete_your_profile_to_get_the_best_matches')}</Text>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
    fontWeight: '400',
  },
});
