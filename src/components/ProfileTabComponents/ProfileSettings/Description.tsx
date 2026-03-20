import React, { useContext, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import AppContext from '../../../context/CreateGlobalStateContext';

const MAX_LENGTH = 500;

const DescriptionInput = () => {
  const {profileText, setProfileText} = useContext(AppContext);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your description</Text>
      <Text style={styles.subtitle}>
        Write about yourself: What’s your profession?{'\n'}Which hobbies do you pursue?
      </Text>

      <TextInput
        style={styles.input}
        value={profileText}
        onChangeText={setProfileText}
        placeholder="Write something..."
        placeholderTextColor="#aaa"
        multiline
        maxLength={MAX_LENGTH}
      />

      <Text style={styles.charCount}>{profileText.length} / {MAX_LENGTH}</Text>
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
    lineHeight: 22,
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
    textAlignVertical: 'top',
    minHeight: 100,
  },
  charCount: {
    marginTop: 8,
    textAlign: 'right',
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
});

export default DescriptionInput;
