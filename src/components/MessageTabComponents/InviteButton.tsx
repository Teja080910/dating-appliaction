import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const InviteButton = () => {
  return (
    <TouchableOpacity style={styles.button}>
      <Text style={styles.text}>Invite now</Text>
    </TouchableOpacity>
  );
};

export default InviteButton;

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#D94B58',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    alignSelf: 'stretch',
    marginTop: 10,
  },
  text: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
});
