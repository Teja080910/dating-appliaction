import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Modal, ActivityIndicator } from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Feather from 'react-native-vector-icons/Feather';
import { locationApi } from '../../../api/locationApi';
import { AuthStorage } from '../../../api/authStorage';
import { colors, radius, shadow } from '../../../constants/theme';

const ChangeLocation = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('');

  useEffect(() => {
    const fetchCurrent = async () => {
      const userIdStr = await AuthStorage.getUserIdStr();
      if (userIdStr) {
        try {
          const loc = await locationApi.current(userIdStr);
          if (loc?.city) {
            setCurrentLocation(`${loc.city}${loc.state ? `, ${loc.state}` : ''}${loc.country ? `, ${loc.country}` : ''}`);
          }
        } catch {}
      }
    };
    fetchCurrent();
  }, []);

  const handleSave = async () => {
    if (!city) {
      Alert.alert('Error', 'Please enter a city');
      return;
    }
    setLoading(true);
    try {
      const userIdStr = await AuthStorage.getUserIdStr();
      if (!userIdStr) return;
      await locationApi.add({
        userId: userIdStr,
        city,
        state,
        country,
        lat: 0,
        lng: 0,
      });
      setCurrentLocation(`${city}${state ? `, ${state}` : ''}${country ? `, ${country}` : ''}`);
      setModalVisible(false);
      Alert.alert('Success', 'Location updated');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TouchableOpacity style={styles.row} onPress={() => setModalVisible(true)}>
        <View style={styles.left}>
          <FontAwesome5 name="globe-europe" size={20} style={styles.icon} />
          <Text style={styles.text}>{currentLocation || 'Change location'}</Text>
        </View>
        <Feather name="chevron-right" size={23} color="#c4c4c4" />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Location</Text>
            <TextInput style={styles.input} placeholder="City" placeholderTextColor="#999" value={city} onChangeText={setCity} />
            <TextInput style={styles.input} placeholder="State" placeholderTextColor="#999" value={state} onChangeText={setState} />
            <TextInput style={styles.input} placeholder="Country" placeholderTextColor="#999" value={country} onChangeText={setCountry} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.7 }]} onPress={handleSave} disabled={loading}>
                {loading ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.saveBtnText}>Save</Text>}
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
  icon: { marginRight: 12, color: '#2f2f2f' },
  text: { fontSize: 16, color: '#000', flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 24, width: '85%', ...shadow.card },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.ink, marginBottom: 20, textAlign: 'center' },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 16,
    fontSize: 15, color: colors.ink, marginBottom: 12,
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  cancelBtnText: { color: colors.inkMuted, fontWeight: '600' },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center' },
  saveBtnText: { color: colors.surface, fontWeight: '600' },
});

export default ChangeLocation;
