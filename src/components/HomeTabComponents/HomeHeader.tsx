import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons'; // Correct for CLI

interface Props {
  selectedFilter: 'online' | 'newest';
  onFilterChange: (filter: 'online' | 'newest') => void;
  onMenuPress: () => void;
}

const HomeHeader = ({ selectedFilter, onFilterChange, onMenuPress }: Props) => {
  return (
    <View style={styles.wrapper}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.logo}>glambu</Text>
        <TouchableOpacity onPress={onMenuPress}>
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
