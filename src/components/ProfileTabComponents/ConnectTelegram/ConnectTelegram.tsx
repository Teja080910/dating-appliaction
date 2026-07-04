import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Modal, ActivityIndicator } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';
import { telegramApi } from '../../../api/telegramApi';
import { AuthStorage } from '../../../api/authStorage';

const ConnectTelegram = () => {
  const [connected, setConnected] = useState(false);
  const [username, setUsername] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [inputUsername, setInputUsername] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkTelegram = async () => {
      const userData = await AuthStorage.getUser();
      const tg = userData?.telegramUsername;
      if (tg) {
        setConnected(true);
        setUsername(tg);
      }
    };
    checkTelegram();
  }, []);

  const handleConnect = async () => {
    if (!inputUsername.trim()) {
      Alert.alert('Error', 'Please enter your Telegram username');
      return;
    }
    setLoading(true);
    try {
      const userIdNum = await AuthStorage.getUserId();
      if (!userIdNum) return;
      const clean = inputUsername.trim().replace('@', '');
      await telegramApi.connect(userIdNum, clean);
      setConnected(true);
      setUsername(clean);
      setModalVisible(false);
      Alert.alert('Success', 'Telegram connected successfully!');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to connect Telegram');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    Alert.alert('Disconnect', 'Are you sure you want to disconnect Telegram?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: async () => {
          try {
            const userIdNum = await AuthStorage.getUserId();
            if (!userIdNum) return;
            await telegramApi.disconnect(userIdNum);
            setConnected(false);
            setUsername('');
            Alert.alert('Success', 'Telegram disconnected');
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message || 'Failed to disconnect');
          }
        },
      },
    ]);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.row}
        onPress={() => connected ? handleDisconnect() : setModalVisible(true)}
      >
        <View style={styles.left}>
          <FontAwesome name="send" size={20} style={styles.icon} />
          <Text style={styles.text}>
            {connected ? `Telegram: @${username}` : 'Connect Your Telegram'}
          </Text>
        </View>
        <Feather name="chevron-right" size={23} color="#c4c4c4" style={styles.chevron} />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Connect Telegram</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your Telegram username (e.g. @username)"
              placeholderTextColor="#999"
              value={inputUsername}
              onChangeText={setInputUsername}
              autoCapitalize="none"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.connectBtn, loading && { opacity: 0.7 }]}
                onPress={handleConnect}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.connectBtnText}>Connect</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#f2f2f2',
  },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  icon: { marginRight: 12, color: '#000' },
  text: { fontSize: 16, color: '#000', flex: 1 },
  chevron: { marginLeft: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '85%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#000', marginBottom: 20, textAlign: 'center' },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16,
    fontSize: 15, color: '#000', marginBottom: 12,
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  cancelBtnText: { color: '#666', fontWeight: '600' },
  connectBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#229ED9', alignItems: 'center' },
  connectBtnText: { color: '#fff', fontWeight: '600' },
});

export default ConnectTelegram;
