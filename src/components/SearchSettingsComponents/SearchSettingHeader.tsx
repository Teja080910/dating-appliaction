import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme, ThemeColors } from '../../theme';
import { t, useTranslation } from '../../i18n';

interface Props {
  onClose: () => void;
}

const SearchSettingsHeader = ({ onClose }: Props) => {
  useTranslation();
  const { themeColors } = useTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity
        onPress={onClose}
        style={styles.backButton}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        activeOpacity={0.7}
      >
        <Icon name="chevron-left" size={28} color={themeColors.text} />
      </TouchableOpacity>
      <Text style={styles.title}>{t('search.searchsettingheader.search_settings')}</Text>
    </View>
  );
};

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: themeColors.background,
    },
    backButton: {
      paddingRight: 10,
      paddingVertical: 2,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: themeColors.text,
      letterSpacing: -0.2,
    },
  });

export default SearchSettingsHeader;

