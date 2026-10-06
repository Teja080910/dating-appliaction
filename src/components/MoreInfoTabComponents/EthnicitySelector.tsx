import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppContext from '../../context/CreateGlobalStateContext';
import { Colors, useTheme } from '../../theme';

const ETHNICITIES = [
  'Asian',
  'Black/African descent',
  'South Asian',
  'Middle Eastern',
  'Pacific Islander',
  'White/Caucasian',
  'Latin/Hispanic',
  'Mixed',
  'Indigenous',
  'Other',
];

const EthnicitySelector = () => {
  const { themeColors } = useTheme();
  const { selectedEthinicity, setSelectedEthinicity } = useContext(AppContext);

  const toggleSelect = (item: string) => {
    setSelectedEthinicity((prev: string | null) => (prev === item ? null : item));
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Icon name="account-multiple-outline" size={22} color={themeColors.text} style={styles.headerIcon} />
        <Text style={[styles.title, { color: themeColors.text }]}>Your race/ethnicity</Text>
      </View>
      <View style={styles.optionsWrap}>
        {ETHNICITIES.map((item) => {
          const isSelected = selectedEthinicity === item;
          return isSelected ? (
            <TouchableOpacity
              key={item}
              activeOpacity={0.8}
              onPress={() => toggleSelect(item)}
              style={styles.pillActiveWrapper}
            >
              <LinearGradient
                colors={[themeColors.primary, themeColors.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.pillActiveGradient}
              >
                <Text style={styles.pillTextActive}>{item}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              key={item}
              activeOpacity={0.7}
              onPress={() => toggleSelect(item)}
              style={[
                styles.pillInactive,
                {
                  backgroundColor: themeColors.surfaceLight,
                  borderColor: themeColors.borderLight,
                },
              ]}
            >
              <Text style={[styles.pillTextInactive, { color: themeColors.text }]}>{item}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default EthnicitySelector;

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
  pillActiveWrapper: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  pillActiveGradient: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillTextActive: {
    fontSize: 14.5,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
