import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootParamList } from '../../utils/types/navigation.types';
import { StackNavigationProp } from '@react-navigation/stack';

interface Props {
  selectedFilter: 'online' | 'newest';
  onFilterChange: (filter: 'online' | 'newest') => void;
}

type HomeHeaderNavigationProp = StackNavigationProp<RootParamList, 'SearchSettings'>;

const HomeHeader = ({ selectedFilter, onFilterChange }: Props) => {
  const navigation = useNavigation<HomeHeaderNavigationProp>();
  
  const handleSearchSettingsPress = () => {
     navigation.navigate('SearchSettings');
  };

  return (
    <View style={styles.wrapper}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>A</Text>
          <Text style={styles.logoText}>MARA</Text>
        </View>
        <TouchableOpacity onPress={handleSearchSettingsPress} style={styles.settingsButton}>
          <Icon name="sliders" size={24} color="#999" />
        </TouchableOpacity>
      </View>

      {/* Toggle buttons (Segmented Control style) */}
      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            selectedFilter === 'online' ? styles.activeButton : styles.inactiveButton,
            { borderTopRightRadius: 0, borderBottomRightRadius: 0 }
          ]}
          onPress={() => onFilterChange('online')}
        >
          <MaterialCommunityIcons 
            name="access-point" 
            size={18} 
            color={selectedFilter === 'online' ? '#fff' : '#999'} 
            style={styles.toggleIcon} 
          />
          <Text
            style={[
              styles.toggleText,
              selectedFilter === 'online' ? styles.activeText : styles.inactiveText,
            ]}
          >
            Online
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            selectedFilter === 'newest' ? styles.activeButton : styles.inactiveButton,
            { borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeftWidth: 0 }
          ]}
          onPress={() => onFilterChange('newest')}
        >
          <MaterialCommunityIcons 
            name="fire" 
            size={18} 
            color={selectedFilter === 'newest' ? '#fff' : '#999'} 
            style={styles.toggleIcon} 
          />
          <Text
            style={[
              styles.toggleText,
              selectedFilter === 'newest' ? styles.activeText : styles.inactiveText,
            ]}
          >
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
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: '#FAFAFA',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FF5A79',
    marginRight: -2,
    marginTop: -8,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FF5A79',
    letterSpacing: -0.5,
  },
  settingsButton: {
    padding: 4,
  },
  segmentedControl: {
    flexDirection: 'row',
    height: 60,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30, // Large pill border radius
  },
  activeButton: {
    backgroundColor: '#6A6A6A', // Dark gray active
    borderWidth: 1,
    borderColor: '#6A6A6A',
    elevation: 2, // Slight shadow
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
  },
  inactiveButton: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  toggleIcon: {
    marginRight: 8,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  activeText: {
    color: '#fff',
  },
  inactiveText: {
    color: '#999',
  },
});

export default HomeHeader;
