import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';
import { profileApi } from '../../api/profileApi';
import { AuthStorage } from '../../api/authStorage';

const AboutProfileScreen = ({ navigation }: any) => {
  const { profileText, setProfileText } = useContext(AppContext);
  const [saving, setSaving] = useState(false);

  const handleNext = async () => {
    setSaving(true);
    try {
      const userIdStr = await AuthStorage.getUserIdStr();
      if (userIdStr) {
        try {
          await profileApi.updateBasic({
            userId: userIdStr,
            bio: profileText,
          });
        } catch {}
      }
    } catch {}
    setSaving(false);
    navigation.navigate('ConnectTelegram');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.progressBackground}>
        <View style={styles.progressBar} />
      </View>

      <Text style={styles.heading}>Wow, looking sharp!</Text>
      <Text style={styles.subtext}>
        Now tell us something about yourself. You can write about your hobbies, values and visions in life.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Your profile text"
        placeholderTextColor="#888"
        value={profileText}
        onChangeText={setProfileText}
        maxLength={500}
        multiline
      />

      <Text style={styles.charCount}>{profileText.length} / 500</Text>

      <Text style={styles.footerText}>
        For more info, questions, feedback, and perhaps to say hello, kindly send an e-mail to hi@dating.com. We will respond within 24 hours :-)
      </Text>

      <TouchableOpacity
        style={[styles.nextButton, { opacity: profileText.trim() && !saving ? 1 : 0.5 }]}
        disabled={!profileText.trim() || saving}
        onPress={handleNext}>
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.nextButtonText}>Next</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

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
    backgroundColor: '#ccc',
    borderRadius: 2,
    marginTop: 10,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBar: { width: '85%', height: '100%', backgroundColor: '#c34e59' },
  heading: { fontSize: 24, fontWeight: 'bold', color: '#000', marginBottom: 10 },
  subtext: { fontSize: 16, color: '#555', marginBottom: 20 },
  input: {
    height: 180,
    borderWidth: 1,
    borderColor: '#c34e59',
    borderRadius: 2,
    padding: 10,
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#000',
  },
  charCount: { textAlign: 'right', color: '#888', marginTop: 4, marginBottom: 30 },
  footerText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  nextButton: {
    backgroundColor: '#c34e59',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  nextButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default AboutProfileScreen;
