import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootParamList } from '../../utils/types/navigation.types';
import { StackNavigationProp } from '@react-navigation/stack';
import AttractiveLogo from '../AttractiveLogo';
import { Colors } from '../../utils/colors';

interface Props {
  selectedFilter: 'online' | 'newest';
  onFilterChange: (filter: 'online' | 'newest') => void;
  onMenuPress?: () => void;
}

type HomeHeaderNavigationProp = StackNavigationProp<RootParamList, 'SearchSettings'>;

const HomeHeader = ({ selectedFilter, onFilterChange }: Props) => {
  const navigation = useNavigation<HomeHeaderNavigationProp>();

  const handleSearchSettingsPress = () => {
    navigation.navigate('SearchSettings');
  };

  return (
    <View style={styles.wrapper}>
      
      {/* 🔝 TOP BAR */}
      <View style={styles.topBar}>
        <View style={styles.logoContainer}>
          <AttractiveLogo size={40} />
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
          <Icon name="sliders" size={22} color="#666" />
        </TouchableOpacity>
      </View>

      {/* 🎛 SEGMENT CONTROL */}
      <View style={styles.segmentedControl}>

        {/* ONLINE */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.toggleButton,
            selectedFilter === 'online' ? styles.activeButton : styles.inactiveButton,
            styles.leftButton
          ]}
          onPress={() => onFilterChange('online')}
        >
          <MaterialCommunityIcons 
            name="access-point" 
            size={18} 
            color={selectedFilter === 'online' ? '#fff' : '#999'} 
            style={styles.toggleIcon} 
          />
          <Text style={[
            styles.toggleText,
            selectedFilter === 'online' ? styles.activeText : styles.inactiveText,
          ]}>
            Online
          </Text>
        </TouchableOpacity>

        {/* NEWEST */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.toggleButton,
            selectedFilter === 'newest' ? styles.activeButton : styles.inactiveButton,
            styles.rightButton
          ]}
          onPress={() => onFilterChange('newest')}
        >
          <MaterialCommunityIcons 
            name="fire" 
            size={18} 
            color={selectedFilter === 'newest' ? '#fff' : '#999'} 
            style={styles.toggleIcon} 
          />
          <Text style={[
            styles.toggleText,
            selectedFilter === 'newest' ? styles.activeText : styles.inactiveText,
          ]}>
            Newest
          </Text>
        </TouchableOpacity>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
    backgroundColor: Colors.background,
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoTextWrap: {
    marginLeft: 10,
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
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  segmentedControl: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 30,
    overflow: 'hidden', // 🔥 smooth pill look
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  leftButton: {
    borderTopLeftRadius: 30,
    borderBottomLeftRadius: 30,
  },

  rightButton: {
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,
  },

  activeButton: {
    backgroundColor: Colors.primary,
    ...Platform.select({
      android: { elevation: 3 },
      ios: {
        shadowColor: Colors.primary,
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 4,
      },
    }),
  },

  inactiveButton: {
    backgroundColor: 'transparent',
  },

  toggleIcon: {
    marginRight: 6,
  },

  toggleText: {
    fontSize: 15,
    fontWeight: '600',
  },

  activeText: {
    color: '#fff',
  },

  inactiveText: {
    color: Colors.grey,
  },
});

export default HomeHeader;
