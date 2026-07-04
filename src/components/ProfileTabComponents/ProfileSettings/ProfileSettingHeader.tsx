import { useNavigation } from '@react-navigation/native';
import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import AppContext from '../../../context/CreateGlobalStateContext';
import { profileApi } from '../../../api/profileApi';
import { AuthStorage } from '../../../api/authStorage';

const ProfileSettingsHeader = () => {
  const navigation = useNavigation();
  const { name, profileText, date } = useContext(AppContext);

  const onCancel = () => {
    navigation.goBack();
  };

  const onSave = async () => {
    try {
      const userIdStr = await AuthStorage.getUserIdStr();
      if (userIdStr) {
        const dobStr = date ? date.toISOString().split('T')[0] : undefined;
        const age = date ? new Date().getFullYear() - date.getFullYear() : undefined;
        await profileApi.saveAllProfile(userIdStr, {
          name: name || undefined,
          displayName: name || undefined,
          bio: profileText || undefined,
          dob: dobStr,
          age,
        });
        Alert.alert('Success', 'Profile updated');
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to save');
    }
  };

  return (
    <SafeAreaView>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel}>
          <Icon name="x" size={28} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.title}>Profile settings</Text>

        <TouchableOpacity onPress={onSave}>
          <Icon name="check" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#e24b5a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
  },
  title: { color: '#fff', fontSize: 20, fontWeight: '600' },
});

export default ProfileSettingsHeader;
