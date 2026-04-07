import {StyleSheet, Text, TouchableOpacity, ActivityIndicator} from 'react-native';
import React from 'react';

interface SaveButtonProps {
    onPress?: () => void;
    loading?: boolean;
}

const SaveButton: React.FC<SaveButtonProps> = ({ onPress, loading }) => {
  return (
    <TouchableOpacity 
      style={[styles.saveButton, loading && { opacity: 0.7 }]} 
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
          <ActivityIndicator color="#fff" />
      ) : (
          <Text style={styles.saveButtonText}>Save Details</Text>
      )}
    </TouchableOpacity>
  );
};

export default SaveButton;

const styles = StyleSheet.create({
  saveButton: {
    paddingVertical: 16,
    borderRadius: 30,
    backgroundColor: '#FF5A79',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginVertical: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
