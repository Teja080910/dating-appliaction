import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

interface DisplayNameProps {
  value: string;
  onChange: (val: string) => void;
}

const DisplayName: React.FC<DisplayNameProps> = ({ value, onChange }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your display name</Text>
      <Text style={styles.subtitle}>You can write your real name or a nickname</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
});

export default DisplayName;
