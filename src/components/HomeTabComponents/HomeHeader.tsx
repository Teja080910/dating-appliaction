import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { RootParamList } from '../../utils/types/navigation.types';
import { StackNavigationProp } from '@react-navigation/stack';

interface Props {
  selectedFilter: 'online' | 'newest';
  onFilterChange: (filter: 'online' | 'newest') => void;
  searchQuery: string;
  onSearchChange: (text: string) => void;
}

type HomeHeaderNavigationProp = StackNavigationProp<RootParamList, 'SearchSettings'>;

const HomeHeader = ({ selectedFilter, onFilterChange, searchQuery, onSearchChange }: Props) => {
  const navigation = useNavigation<HomeHeaderNavigationProp>();
  const handleSearchSettingsPress = () => {
     navigation.navigate('SearchSettings');
  }
  return (
    <View style={styles.wrapper}>
      <View style={styles.topBar}>
        <Text style={styles.logo}>Dating</Text>
        <TouchableOpacity onPress={handleSearchSettingsPress}>
          <Ionicons name="menu-outline" size={28} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={onSearchChange}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
    borderRadius: 20,
    paddingHorizontal: 12,
    marginTop: 10,
    height: 40,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#333', padding: 0 },
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
