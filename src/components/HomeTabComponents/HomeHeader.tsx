import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { RootParamList } from '../../utils/types/navigation.types';
import { StackNavigationProp } from '@react-navigation/stack';
import AttractiveLogo from '../AttractiveLogo';
import { Colors, Spacing, Shadows, Typography } from '../../theme';

interface Props {
  selectedFilter: 'online' | 'newest';
  onFilterChange: (filter: 'online' | 'newest') => void;
  onMenuPress?: () => void;
}

type HomeHeaderNavigationProp = StackNavigationProp<RootParamList, 'SearchSettings'>;

const HomeHeader = ({ selectedFilter, onFilterChange }: Props) => {
  const navigation = useNavigation<HomeHeaderNavigationProp>();
  const insets = useSafeAreaInsets();

  const handleSearchSettingsPress = () => {
    navigation.navigate('SearchSettings');
  };

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top + Spacing.md }]}>
      <View style={styles.topBar}>
        <View style={styles.logoContainer}>
          <AttractiveLogo size={36} />
          <View style={styles.logoTextWrap}>
            <Text style={styles.logoText}>AMARA</Text>
            <Text style={styles.logoSubtext}>Curated private matches</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSearchSettingsPress}
          style={styles.settingsButton}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={[Colors.glass, Colors.glassLight]}
            style={styles.settingsGradient}
          >
            <Icon name="sliders" size={20} color={Colors.textSecondary} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.segmentedControl}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.toggleButton,
            selectedFilter === 'online' ? styles.activeButton : styles.inactiveButton,
          ]}
          onPress={() => onFilterChange('online')}
        >
          {selectedFilter === 'online' ? (
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.activeGradient}
            >
              <MaterialCommunityIcons name="access-point" size={16} color={Colors.white} style={styles.toggleIcon} />
              <Text style={styles.activeText}>Active now</Text>
            </LinearGradient>
          ) : (
            <View style={styles.inactiveContent}>
              <MaterialCommunityIcons name="access-point" size={16} color={Colors.textMuted} style={styles.toggleIcon} />
              <Text style={styles.inactiveText}>Active now</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.toggleButton,
            selectedFilter === 'newest' ? styles.activeButton : styles.inactiveButton,
          ]}
          onPress={() => onFilterChange('newest')}
        >
          {selectedFilter === 'newest' ? (
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.activeGradient}
            >
              <MaterialCommunityIcons name="fire" size={16} color={Colors.white} style={styles.toggleIcon} />
              <Text style={styles.activeText}>Just joined</Text>
            </LinearGradient>
          ) : (
            <View style={styles.inactiveContent}>
              <MaterialCommunityIcons name="fire" size={16} color={Colors.textMuted} style={styles.toggleIcon} />
              <Text style={styles.inactiveText}>Just joined</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoTextWrap: {
    marginLeft: Spacing.md,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: 1,
  },
  logoSubtext: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: Spacing.radiusFull,
    overflow: 'hidden',
  },
  settingsGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Spacing.radiusFull,
  },
  segmentedControl: {
    flexDirection: 'row',
    height: 48,
    borderRadius: Spacing.radiusXl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: 3,
  },
  toggleButton: {
    flex: 1,
    borderRadius: Spacing.radiusLg,
    overflow: 'hidden',
  },
  activeButton: {},
  inactiveButton: {
    backgroundColor: 'transparent',
  },
  activeGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Spacing.radiusLg,
  },
  inactiveContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleIcon: {
    marginRight: 6,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  inactiveText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default HomeHeader;
