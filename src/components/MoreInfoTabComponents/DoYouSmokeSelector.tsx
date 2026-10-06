import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppContext from '../../context/CreateGlobalStateContext';
import { Colors, useTheme } from '../../theme';

const OPTIONS = ['Yes', 'No', 'Sometimes'];

const DoYouSmokeSelector = () => {
  const { themeColors } = useTheme();
  const { selectedSmoking, setSelectedSmoking } = useContext(AppContext);

  const toggleSelect = (item: string) => {
    setSelectedSmoking((prev: string | null) => (prev === item ? null : item));
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Icon name="smoking" size={22} color={themeColors.text} style={styles.headerIcon} />
        <Text style={[styles.title, { color: themeColors.text }]}>Do you smoke?</Text>
      </View>
      <View style={styles.optionsWrap}>
        {OPTIONS.map((option) => {
          const isSelected = selectedSmoking === option;
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
              style={[
                styles.pillInactive,
                {
                  backgroundColor: themeColors.surfaceLight,
                  borderColor: themeColors.borderLight,
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

export default DoYouSmokeSelector;

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
    paddingHorizontal: 18,
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
    paddingHorizontal: 18,
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
