// src/components/LogoutRow.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const Logout = () => {
  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.6}>
      <View style={styles.row}>
        <Ionicons name="log-out-outline" size={24} color="#333" style={styles.icon} />
        <Text style={styles.text}>Log out</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#bbb" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f2f2f2',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  text: {
    fontSize: 16,
    color: '#111',
  },
});

export default Logout;
