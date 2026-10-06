import React, { useContext, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppContext from '../../context/CreateGlobalStateContext';
import { useTheme, ThemeColors } from '../../theme';

const OPTIONS = [
  'Below 50k',
  '50k+',
  '250k+',
  '1 Million+',
  '5 Million+',
  'Prefer not to say',
];

const NetWorthSelector = () => {
  const { themeColors } = useTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const { selectedNetWorth, setSelectedNetWorth } = useContext(AppContext);

  const toggleSelect = (item: string) => {
    setSelectedNetWorth((prev: string | null) => (prev === item ? null : item));
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Icon name="currency-usd" size={22} color={themeColors.text} style={styles.headerIcon} />
        <Text style={styles.title}>Net Worth (USD)</Text>
      </View>
      <View style={styles.optionsWrap}>
        {OPTIONS.map((option) => {
          const isSelected = selectedNetWorth === option;
          return isSelected ? (
            <TouchableOpacity
              key={option}
              activeOpacity={0.8}
              onPress={() => toggleSelect(option)}
              style={styles.pillActiveWrapper}
            >
              <LinearGradient
                colors={[themeColors.primary, themeColors.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.pillActiveGradient}
              >
                <Text style={styles.pillTextActive}>{option}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              key={option}
              activeOpacity={0.7}
              onPress={() => toggleSelect(option)}
              style={styles.pillInactive}
            >
              <Text style={styles.pillTextInactive}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default NetWorthSelector;

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
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
      color: themeColors.text,
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
      backgroundColor: themeColors.surfaceLight,
      borderWidth: 1,
      borderColor: themeColors.borderLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pillTextInactive: {
      fontSize: 14.5,
      color: themeColors.text,
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
