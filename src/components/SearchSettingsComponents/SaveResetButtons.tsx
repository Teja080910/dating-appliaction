import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

const SaveResetButtons = () => {
  const onSave = () => {
    console.log('Settings saved');
  };

  const onReset = () => {
    console.log('Settings reset');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={onSave}>
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={onReset}>
        <Text style={styles.buttonText}>Reset</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8, // adds space above nav bar
    marginBottom: 10,  // moves the buttons up from bottom
    backgroundColor: '#f2f2f2',
  },
  button: {
    flex: 1,
    backgroundColor: '#d33',
    paddingVertical: 14,
    borderRadius: 14,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SaveResetButtons;
