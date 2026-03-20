import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform
} from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';

const AboutProfileScreen = ({ navigation }: any) => {

  const {profileText, setProfileText} = useContext(AppContext);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Progress Bar */}
      <View style={styles.progressBackground}>
        <View style={styles.progressBar} />
      </View>

      {/* Heading */}
      <Text style={styles.heading}>Wow, looking sharp!</Text>
      
      {/* Subtext */}
      <Text style={styles.subtext}>
        Now tell us something about yourself. You can write about your hobbies, values and visions in life.
      </Text>

      {/* Input box */}
      <TextInput
        style={styles.input}
        placeholder="Your profile text"
        placeholderTextColor="#888"
        value={profileText}
        onChangeText={setProfileText}
        maxLength={500}
        multiline
      />
      
      {/* Character Count */}
      <Text style={styles.charCount}>{profileText.length} / 500</Text>

      {/* Footer Info */}
      <Text style={styles.footerText}>
        For more info, questions, feedback, and perhaps to say hello, kindly send an e-mail to hi@amara.app. We will respond within 24 hours :-)
      </Text>

      {/* Next Button */}
      <TouchableOpacity
        style={[
          styles.nextButton,
          { opacity: profileText.trim() ? 1 : 0.5 }
        ]}
        disabled={!profileText.trim()}
        onPress={() => {
           navigation.navigate('ConnectTelegram')
        }}
      >
        <Text style={styles.nextButtonText}>Next</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default AboutProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 0,
    backgroundColor: '#fff',
    justifyContent: 'flex-start',
  },
  progressBackground: {
    height: 4,
    backgroundColor: '#eee',
    borderRadius: 2,
    marginTop: 10,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBar: {
    width: '85%',
    height: '100%',
    backgroundColor: '#FF5A79',
  },
  heading: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000',
    marginBottom: 10,
  },
  subtext: {
    fontSize: 16,
    color: '#555',
    lineHeight: 22,
    marginBottom: 20,
  },
  input: {
    height: 180,
    borderWidth: 1.2,
    borderColor: '#FF5A79',
    borderRadius: 12,
    padding: 15,
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fdfdfd',
  },
  charCount: {
    textAlign: 'right',
    color: '#888',
    marginTop: 6,
    marginBottom: 30,
    fontWeight: '600',
  },
  footerText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 18,
  },
  nextButton: {
    backgroundColor: '#FF5A79',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#FF5A79',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
});
