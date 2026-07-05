import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootParamList } from '../../../utils/types/navigation.types';
import { AuthStorage } from '../../../api/authStorage';
import { onlineStatusApi } from '../../../api/onlineStatusApi';

const Logout = () => {
  const navigation = useNavigation<StackNavigationProp<RootParamList>>();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          const userId = await AuthStorage.getUserIdStr();
          if (userId) {
            try { await onlineStatusApi.setOffline(userId); } catch {}
          }
          await AuthStorage.clear();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        },
      },
    ]);
  };

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.6} onPress={handleLogout}>
      <View style={styles.row}>
        <Ionicons name="log-out-outline" size={24} color="#333" style={styles.icon} />
        <Text style={styles.text}>Log out</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#bbb" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f2f2f2',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: 12 },
  text: { fontSize: 16, color: '#111' },
});

export default Logout;
