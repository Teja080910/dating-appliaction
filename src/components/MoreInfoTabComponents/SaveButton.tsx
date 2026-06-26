import { StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import React from 'react';
import { Colors, Spacing } from '../../theme';

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
          <ActivityIndicator color={Colors.white} />
      ) : (
          <Text style={styles.saveButtonText}>Save Details</Text>
      )}
    </TouchableOpacity>
  );
};

export default SaveButton;

const styles = StyleSheet.create({
  saveButton: {
    paddingVertical: Spacing.lg,
    borderRadius: Spacing.radiusFull,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.xl,
    marginVertical: Spacing.xl,
    elevation: 4,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
