import React, { useContext } from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAuth } from '../../../api/useAuth';
import AppContext from '../../../context/CreateGlobalStateContext';
import { Colors, Spacing } from '../../../theme';

const Logout = () => {
  const navigation = useNavigation();
  const { logout } = useAuth();
  const { setLogin, setAuthUserId } = useContext(AppContext);

  const handleLogout = async () => {
    try {
      await logout();
      setLogin?.(false);
      setAuthUserId?.(null);
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
      );
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      activeOpacity={0.6}
      onPress={handleLogout}
    >
      <Ionicons name="log-out-outline" size={24} color={Colors.error} />
      <Text style={styles.text}>Log out</Text>
    </TouchableOpacity>
  );
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
