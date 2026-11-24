import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { t, useTranslation } from '../../i18n';

interface HeaderProps {
  showBackButton?: boolean;
  onBackPress?: () => void;
}

const Header: React.FC<HeaderProps> = ({ showBackButton, onBackPress }) => {
  useTranslation();
  const { themeColors } = useTheme();
  const navigation = useNavigation<any>();

  const canGoBack = showBackButton !== undefined ? showBackButton : navigation?.canGoBack?.();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (navigation?.canGoBack?.()) {
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.topRow}>
        {canGoBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('common.navigation.back', { defaultValue: 'Back' })}
          >
            <Feather name="chevron-left" size={28} color={themeColors.text} />
          </TouchableOpacity>
        ) : null}
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: themeColors.text }]}>{t('more_info.header.about_me')}</Text>
        </View>
        {canGoBack ? <View style={styles.rightSpacer} /> : null}
      </View>
      <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
        {t('more_info.header.complete_your_profile_to_get_the_best_matches')}
      </Text>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  backButton: {
    marginRight: 6,
    padding: 2,
    marginLeft: -6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleWrap: {
    flex: 1,
  },
  rightSpacer: {
    width: 24,
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
    fontWeight: '400',
  },
});
