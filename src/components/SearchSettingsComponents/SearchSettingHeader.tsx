import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons'; // or use MaterialIcons

interface Props {
  onClose: () => void;
}

const SearchSettingsHeader = ({ onClose }: Props) => {
  return (
    <View style={styles.headerContainer}>
      <Text style={styles.title}>Search Settings</Text>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Ionicons name="close" size={28} color="#888" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f2f2f2',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111',
    fontFamily: 'sans-serif-medium',
  },
  closeButton: {
    padding: 4,
  },
});

export default SearchSettingsHeader;
