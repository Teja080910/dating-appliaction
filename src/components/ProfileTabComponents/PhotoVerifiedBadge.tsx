import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

const PhotoVerifiedBadge = () => {
  return (
    <View style={styles.badgeContainer}>
      <Icon name="check-circle" solid size={20} color="#d76d7c" style={styles.icon} />
      <Text style={styles.text}>You’re verified by photo!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f2f2f2',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    flexShrink: 1,

    fontSize: 16,
    color: '#000',
  },
});

export default PhotoVerifiedBadge;
