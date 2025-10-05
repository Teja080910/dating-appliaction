import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/Feather'; // You can use Ionicons or MaterialIcons too

const ProfileSettingsHeader = () => {
  const navigation = useNavigation();
  const onCancel = () => {
    navigation.goBack()
  }
  const onSave = () => {
    console.log('Settings saved');
    
  }
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
    backgroundColor: '#e24b5a', // Match the red background
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
