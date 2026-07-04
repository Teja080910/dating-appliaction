import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthStorage } from '../../api/authStorage';
import { telegramApi } from '../../api/telegramApi';

const ConnectTelegramScreen = ({ navigation }: any) => {
  const [connecting, setConnecting] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState('');

  const completeOnboarding = async () => {
    await AsyncStorage.setItem('entryHomeScreen', 'true');
    navigation.replace('BottomTabs');
  };

  const handleSkip = async () => {
    await completeOnboarding();
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleConnectTelegram = async () => {
    if (!telegramUsername.trim()) {
      Alert.alert('Error', 'Please enter your Telegram username');
      return;
    }
    setConnecting(true);
    try {
      const userId = await AuthStorage.getUserId();
      if (userId) {
        const cleanUsername = telegramUsername.trim().replace('@', '');
        await telegramApi.connect(userId, cleanUsername);
        Alert.alert('Success', 'Telegram connected successfully!');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to connect Telegram');
    }
    setConnecting(false);
    await completeOnboarding();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.progressBackground}>
        <View style={styles.progressBar} />
      </View>

      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipBtnText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Image
          source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg' }}
          style={styles.telegramIcon}
        />

        <Text style={styles.heading}>Connect Your Telegram</Text>

        <Text style={styles.description}>
          Effortlessly manage your invitations directly from the Telegram app and invite nearby users with just one click.
        </Text>

        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>💙</Text>
          <Text style={styles.bulletText}>Receive accepted invitations instantly on Telegram.</Text>
        </View>

        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>🔔</Text>
          <Text style={styles.bulletText}>
            Discover new profiles near you and send invites with a single tap.
          </Text>
        </View>

        <TextInput
          style={styles.telegramInput}
          placeholder="Enter your Telegram username (e.g. @username)"
          placeholderTextColor="#999"
          value={telegramUsername}
          onChangeText={setTelegramUsername}
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.connectBtn, connecting && { opacity: 0.7 }]}
          onPress={handleConnectTelegram}
          disabled={connecting}>
          {connecting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.connectBtnText}>Connect Telegram</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Your Telegram information is always private—we never share it with anyone.
        </Text>
      </View>

      <TouchableOpacity style={styles.bottomSkip} onPress={handleSkip}>
        <Text style={styles.skipBtnText}>Skip</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  progressBackground: {
    height: 4,
    backgroundColor: '#ccc',
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: { height: 4, width: '95%', backgroundColor: '#c34e59' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  closeIcon: { fontSize: 26, color: '#c34e59' },
  skipBtn: {
    backgroundColor: '#aaa',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
  },
  skipBtnText: { color: '#fff', fontSize: 16 },
  card: {
    padding: 25,
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: '#fdfdfd',
    borderRadius: 8,
    elevation: 3,
  },
  telegramIcon: {
    width: 50,
    height: 50,
    alignSelf: 'center',
    marginBottom: 15,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#111',
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    color: '#444',
    marginBottom: 20,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bullet: { fontSize: 18, marginRight: 8 },
  bulletText: { flex: 1, fontSize: 15, color: '#333' },
  telegramInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#000',
    marginVertical: 10,
  },
  connectBtn: {
    backgroundColor: '#229ED9',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 20,
  },
  connectBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  footerText: {
    fontSize: 13,
    textAlign: 'center',
    color: '#aaa',
  },
  bottomSkip: {
    marginTop: 10,
    alignSelf: 'center',
    backgroundColor: '#888',
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 20,
  },
});

export default ConnectTelegramScreen;
