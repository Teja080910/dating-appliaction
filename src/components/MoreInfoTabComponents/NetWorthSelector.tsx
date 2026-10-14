import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppContext from '../../context/CreateGlobalStateContext';
import { useTheme } from '../../theme';
import { t, useTranslation } from '../../i18n';

const OPTIONS = [
  'Below 50k',
  '50k+',
  '250k+',
  '1 Million+',
  '5 Million+',
  'Prefer not to say',
];

const NetWorthSelector = () => {
  useTranslation();
  const { themeColors } = useTheme();
  const { selectedNetWorth, setSelectedNetWorth } = useContext(AppContext);

  const toggleSelect = (item: string) => {
    setSelectedNetWorth((prev: string | null) => (prev === item ? null : item));
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Icon name="currency-usd" size={22} color={themeColors.text} style={styles.headerIcon} />
        <Text style={[styles.title, { color: themeColors.text }]}>{t('more_info.networthselector.net_worth_usd')}</Text>
      </View>
      <View style={styles.optionsWrap}>
        {OPTIONS.map((option) => {
          const isSelected = selectedNetWorth === option;
          return isSelected ? (
            <TouchableOpacity
              key={option}
              activeOpacity={0.8}
              onPress={() => toggleSelect(option)}
              style={[styles.pillActive, { backgroundColor: themeColors.primary }]}
            >
              <Text style={styles.pillTextActive}>{option}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              key={option}
              activeOpacity={0.7}
              onPress={() => toggleSelect(option)}
              style={[
                styles.pillInactive,
                {
                  backgroundColor: themeColors.surfaceLight,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <Text style={[styles.pillTextInactive, { color: themeColors.text }]}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default NetWorthSelector;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 22,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerIcon: {
    marginRight: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillInactive: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillTextInactive: {
    fontSize: 14.5,
    fontWeight: '500',
  },
  pillActive: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillTextActive: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
