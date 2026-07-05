import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { accountApi } from '../../../api/accountApi';
import { AuthStorage } from '../../../api/authStorage';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootParamList } from '../../../utils/types/navigation.types';

const DeactivateMyProfile = () => {
  const navigation = useNavigation<StackNavigationProp<RootParamList>>();

  const handleDeactivate = async () => {
    Alert.alert(
      'Deactivate Profile',
      'Your profile will be hidden until you log in again. You can reactivate anytime by logging back in. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              const userIdNum = await AuthStorage.getUserId();
              if (userIdNum) {
                await accountApi.deactivate(userIdNum);
              }
              await AuthStorage.clear();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message || 'Failed to deactivate profile');
            }
          },
        },
      ],
    );
  };

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.6} onPress={handleDeactivate}>
      <View style={styles.row}>
        <Ionicons name="pause-circle-outline" size={24} color="#333" style={styles.icon} />
        <Text style={styles.text}>Deactivate my profile</Text>
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
    color: '#333',
  },
});

export default DeactivateMyProfile;
