import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppContext from '../../context/CreateGlobalStateContext';
import { Colors, useTheme } from '../../theme';

const bodyTypes = ['Slim', 'Muscular', 'Athletic', 'Average', 'A few extra pounds', 'Other'];

const BodyTypeSelector = () => {
  const { themeColors } = useTheme();
  const { selectedBodyType, setSelectedBodyType } = useContext(AppContext);

  const toggleBodyType = (type: string) => {
    if (selectedBodyType === type) {
      setSelectedBodyType(null);
    } else {
      setSelectedBodyType(type);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Icon name="human" size={22} color={themeColors.text} style={styles.headerIcon} />
        <Text style={[styles.title, { color: themeColors.text }]}>Your body type</Text>
      </View>
      <View style={styles.optionsWrap}>
        {bodyTypes.map((type) => {
          const isSelected = selectedBodyType === type;
          return isSelected ? (
            <TouchableOpacity
              key={type}
              activeOpacity={0.8}
              onPress={() => toggleBodyType(type)}
              style={styles.pillActiveWrapper}
            >
              <LinearGradient
                colors={[themeColors.primary, themeColors.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.pillActiveGradient}
              >
                <Text style={styles.pillTextActive}>{type}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              key={type}
              activeOpacity={0.7}
              onPress={() => toggleBodyType(type)}
              style={[
                styles.pillInactive,
                {
                  backgroundColor: themeColors.surfaceLight,
                  borderColor: themeColors.borderLight,
                },
              ]}
            >
              <Text style={[styles.pillTextInactive, { color: themeColors.text }]}>{type}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default BodyTypeSelector;

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
