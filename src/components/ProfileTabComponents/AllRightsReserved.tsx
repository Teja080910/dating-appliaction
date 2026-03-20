// src/components/AppFooter.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AllRightsReserved = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>AMARA</Text>
      <Text style={styles.footerText}>2025 © Glambu app. All rights reserved.{'\n'}v. 4.2.2</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    alignItems: 'center',
    backgroundColor: '#f2f2f2', // Matches light background
  },
  brand: {
    fontSize: 24,
    fontWeight: '400',
    color: '#b0b0b0', // light gray
    marginBottom: 4,
  },
  footerText: {
    fontSize: 14,
    color: '#b0b0b0', // light gray
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AllRightsReserved;
