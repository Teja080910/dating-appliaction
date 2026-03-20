import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import AppContext from '../../../context/CreateGlobalStateContext';

const ProfileSettingsHeader = () => {
  const navigation = useNavigation();
  const onCancel = () => {
    navigation.goBack()
  }
  const { name, profileText } = React.useContext(AppContext);

  const onSave = () => {
    if (!name || name.trim() === '' || !profileText || profileText.trim() === '') {
      Alert.alert("Incomplete", "Please enter your name and some description.");
      return;
    }
    Alert.alert("Success", "Profile settings updated!", [{ text: "OK", onPress: () => navigation.goBack() }]);
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
    backgroundColor: '#FF5A79', // Amara Theme color
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
});

export default ProfileSettingsHeader;
