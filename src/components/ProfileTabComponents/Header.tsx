import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Header = () => {
  return (
    <View style={styles.headerContainer}>
      <Text style={styles.headerText}>Dating</Text>
      <View style={styles.divider} />
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#f5f5f5', // same as screenshot background
    alignItems: 'center',
    paddingVertical: 20,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#cc1e42',
    fontFamily: 'sans-serif-medium',
  },
  divider: {
    marginTop: 14, // pushed further down
    width: '100%',
    height: 2,
    backgroundColor: '#cc1e42',
  },
});
