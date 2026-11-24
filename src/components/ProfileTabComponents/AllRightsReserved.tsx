import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { t, useTranslation } from '../../i18n';

const AllRightsReserved = () => {
  useTranslation();
  const { themeColors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Text style={[styles.brand, { color: themeColors.textMuted }]}>{t('home.homeheader.amara')}</Text>
      <Text style={[styles.footerText, { color: themeColors.textMuted }]}>
        {t('profile.allrightsreserved.copyright')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  brand: {
    fontSize: 24,
    fontWeight: '400',
    marginBottom: 4,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AllRightsReserved;
