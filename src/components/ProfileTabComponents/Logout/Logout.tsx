import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, CommonActions } from '@react-navigation/native';

const Logout = () => {
  const navigation = useNavigation();

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          onPress: async () => {
            try {
              // Clear session data
              await AsyncStorage.multiRemove([
                'isLoggedIn',
                'entryHomeScreen',
                'isRegistered',
                'acceptedTerms',
                'GenderOrientation'
              ]);
              
              // Reset navigation stack and go to Register screen
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Register' }],
                })
              );
            } catch (error) {
              console.error('Error logging out:', error);
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      activeOpacity={0.6}
      onPress={handleLogout}
    >
      <View style={styles.row}>
        <Ionicons name="log-out-outline" size={24} color="#FF5A79" style={styles.icon} />
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
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  text: {
    flexShrink: 1,
    fontSize: 16,
    color: '#111',
    fontWeight: '500',
  },
});

export default Logout;
