import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import apiClient from '../../../api/apiClient';
import { AuthStorage } from '../../../api/authStorage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootParamList } from '../../../utils/types/navigation.types';

const DeleteMyProfile = () => {
  const navigation = useNavigation<StackNavigationProp<RootParamList>>();

  const handleDelete = async () => {
    Alert.alert(
      'Delete Profile',
      'Are you sure you want to permanently delete your profile? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const userIdNum = await AuthStorage.getUserId();
              if (userIdNum) {
                await apiClient.delete('/account/delete', { params: { userId: userIdNum } });
              }
              await AuthStorage.clear();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch {}
          },
        },
      ],
    );
  };

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.6} onPress={handleDelete}>
      <View style={styles.row}>
        <Ionicons name="trash-outline" size={24} color="#d9534f" style={styles.icon} />
        <Text style={styles.text}>Delete my profile</Text>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  text: {
    fontSize: 16,
    color: '#d9534f', // red (Bootstrap danger-like)
  },
});

export default DeleteMyProfile;
