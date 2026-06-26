import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { clearAuthSession } from '../../../utils/session';
import { useAlert } from '../../../components/AlertModal';
import { Colors, Spacing } from '../../../theme';

const Logout = () => {
  const navigation = useNavigation();
  const { alert, AlertComponent } = useAlert();

  const handleLogout = async () => {
    alert(
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
              await clearAuthSession();
              
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
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
    <>
    <TouchableOpacity 
      style={styles.container} 
      activeOpacity={0.6}
      onPress={handleLogout}
    >
      <Ionicons name="log-out-outline" size={24} color={Colors.error} />
      <Text style={styles.text}>Log out</Text>
    </TouchableOpacity>
      {AlertComponent}
    </>);
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  text: {
    fontSize: 16,
    color: Colors.error,
    fontWeight: '600',
  },
});

export default Logout;
