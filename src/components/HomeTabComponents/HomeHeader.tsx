import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons'; // Correct for CLI
import { RootParamList } from '../../utils/types/navigation.types';
import { StackNavigationProp } from '@react-navigation/stack';

interface Props {
  selectedFilter: 'online' | 'newest';
  onFilterChange: (filter: 'online' | 'newest') => void;
  // Adjust type as needed
}

type HomeHeaderNavigationProp = StackNavigationProp<RootParamList, 'SearchSettings'>;


const HomeHeader = ({ selectedFilter, onFilterChange }: Props) => {
  const navigation = useNavigation<HomeHeaderNavigationProp>();
  const handleSearchSettingsPress = () => {
     navigation.navigate('SearchSettings');
  }
  return (
    <View style={styles.wrapper}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.logo}>Dating</Text>
        <TouchableOpacity onPress={handleSearchSettingsPress}>
          <Ionicons name="menu-outline" size={28} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Toggle buttons */}
      <View style={styles.toggleWrapper}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            selectedFilter === 'online' && styles.selectedButton,
          ]}
          onPress={() => onFilterChange('online')}
        >
          <Text
            style={[
              styles.toggleText,
              selectedFilter === 'online' && styles.selectedText,
            ]}
          >
            Online
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            selectedFilter === 'newest' && styles.selectedButton,
          ]}
          onPress={() => onFilterChange('newest')}
        >
          <Text
            style={[
              styles.toggleText,
              selectedFilter === 'newest' && styles.selectedText,
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
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 5,
    backgroundColor: '#fff',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#e94e77',
    fontFamily: 'sans-serif-medium',
  },
  toggleWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#f1f1f1',
    marginHorizontal: 5,
    borderRadius: 20,
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: '#333',
  },
  toggleText: {
    fontSize: 14,
    color: '#333',
  },
  selectedText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default HomeHeader;
