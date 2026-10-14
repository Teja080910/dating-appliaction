import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppContext from '../../context/CreateGlobalStateContext';
import { useTheme } from '../../theme';
import { t, useTranslation } from '../../i18n';

const appearances = ['Very attractive', 'Attractive', 'Average', 'Below average'];
const appearanceLabel = (val: string) =>
  val === 'Attractive' ? t('profile.userdetails.attractive') : val;

const AppearanceSelector = () => {
  useTranslation();
  const { themeColors } = useTheme();
  const { selectedAppearance, setSelectedAppearance } = useContext(AppContext);

  const toggleAppearance = (appearance: string) => {
    if (selectedAppearance?.toLowerCase() === appearance.toLowerCase()) {
      setSelectedAppearance(null);
    } else {
      setSelectedAppearance(appearance);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Icon name="emoticon-happy-outline" size={22} color={themeColors.text} style={styles.headerIcon} />
        <Text style={[styles.title, { color: themeColors.text }]}>{t('more_info.appearanceselector.your_appearance')}</Text>
      </View>
      <View style={styles.optionsWrap}>
        {appearances.map((appearance) => {
          const isSelected = selectedAppearance?.toLowerCase() === appearance.toLowerCase();
          return isSelected ? (
            <TouchableOpacity
              key={appearance}
              activeOpacity={0.8}
              onPress={() => toggleAppearance(appearance)}
              style={[styles.pillActive, { backgroundColor: themeColors.primary }]}
            >
              <Text style={styles.pillTextActive}>{appearanceLabel(appearance)}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              key={appearance}
              activeOpacity={0.7}
              onPress={() => toggleAppearance(appearance)}
              style={[
                styles.pillInactive,
                {
                  backgroundColor: themeColors.surfaceLight,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <Text style={[styles.pillTextInactive, { color: themeColors.text }]}>{appearanceLabel(appearance)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default AppearanceSelector;

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
