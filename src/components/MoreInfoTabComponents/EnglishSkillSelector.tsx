import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppContext from '../../context/CreateGlobalStateContext';
import { useTheme } from '../../theme';
import { t, useTranslation } from '../../i18n';

const getLevels = () => [t('onboarding.moredetailsscreen.basic'), t('profile.userdetails.medium'), 'Good', 'Very Good'];

const EnglishSkillSelector = () => {
  useTranslation();
  const { themeColors } = useTheme();
  const { englishSkillLevel, setEnglishSkillLevel } = useContext(AppContext);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Icon name="earth" size={22} color={themeColors.text} style={styles.headerIcon} />
        <Text style={[styles.title, { color: themeColors.text }]}>{t('more_info.englishskillselector.how_good_is_your_english')}</Text>
      </View>
      <View style={styles.optionsWrap}>
        {getLevels().map((level, index) => {
          const isSelected = englishSkillLevel === index;
          return isSelected ? (
            <TouchableOpacity
              key={level}
              activeOpacity={0.8}
              onPress={() => setEnglishSkillLevel(index)}
              style={[styles.pillActive, { backgroundColor: themeColors.primary }]}
            >
              <Text style={styles.pillTextActive}>{level}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              key={level}
              activeOpacity={0.7}
              onPress={() => setEnglishSkillLevel(index)}
              style={[
                styles.pillInactive,
                {
                  backgroundColor: themeColors.surfaceLight,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <Text style={[styles.pillTextInactive, { color: themeColors.text }]}>{level}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default EnglishSkillSelector;

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
