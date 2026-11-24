import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppContext from '../../context/CreateGlobalStateContext';
import { useTheme } from '../../theme';
import { t, useTranslation } from '../../i18n';

const options = ['Hookup', 'Casual dating', 'Online relationship', 'Relationship', 'Marriage'];
const lookingForLabel = (val: string) =>
  val === 'Casual dating' ? t('profile.userdetails.casual_dating')
  : val === 'Relationship' ? t('profile.userdetails.relationship')
  : val;

const LookingForSelector = () => {
  useTranslation();
  const { themeColors } = useTheme();
  const { selectedLookingFor, setSelectedLookingFor } = useContext(AppContext);

  const toggleOption = (option: string) => {
    const list = Array.isArray(selectedLookingFor) ? selectedLookingFor : [];
    const exists = list.some((item) => item.toLowerCase() === option.toLowerCase());
    if (exists) {
      setSelectedLookingFor(list.filter((item) => item.toLowerCase() !== option.toLowerCase()));
    } else {
      setSelectedLookingFor([...list, option]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Icon name="heart-outline" size={22} color={themeColors.text} style={styles.headerIcon} />
        <Text style={[styles.title, { color: themeColors.text }]}>{t('more_info.lookingforselector.what_are_you_looking_for')}</Text>
      </View>
      <View style={styles.optionsWrap}>
        {options.map((item) => {
          const list = Array.isArray(selectedLookingFor) ? selectedLookingFor : [];
          const isSelected = list.some((val) => val.toLowerCase() === item.toLowerCase());
          return isSelected ? (
            <TouchableOpacity
              key={item}
              activeOpacity={0.8}
              onPress={() => toggleOption(item)}
              style={[styles.pillActive, { backgroundColor: themeColors.primary }]}
            >
              <Text style={styles.pillTextActive}>{lookingForLabel(item)}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              key={item}
              activeOpacity={0.7}
              onPress={() => toggleOption(item)}
              style={[
                styles.pillInactive,
                {
                  backgroundColor: themeColors.surfaceLight,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <Text style={[styles.pillTextInactive, { color: themeColors.text }]}>{lookingForLabel(item)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default LookingForSelector;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 26,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
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
    gap: 10,
  },
  pillInactive: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
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
    paddingVertical: 10,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillTextActive: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
