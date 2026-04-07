import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootParamList } from '../../utils/types/navigation.types';

import { Colors } from '../../utils/colors';

type NavigationProp = StackNavigationProp<RootParamList>;

const InviteButton = () => {
  const navigation = useNavigation<NavigationProp>();

  const handlePress = () => {
    try {
      console.log('Navigating to Home...');
      
      // ✅ SAFE NAVIGATION (Tab ya Stack dono handle karega)
      navigation.navigate('Home' as never);
      
    } catch (error) {
      console.error('Navigation Error:', error);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.button}
      onPress={handlePress}
    >
      <Icon
        name="heart-flash"
        size={20}
        color="#fff"
        style={styles.icon}
      />
      <Text style={styles.text}>Invite now</Text>
    </TouchableOpacity>
  );
};

export default InviteButton;

// ================= STYLES =================
const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    marginTop: 10,

    // ✅ SHADOW FIX (Android + iOS)
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  icon: {
    marginRight: 10,
    transform: [{ rotate: '-15deg' }],
  },
  text: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});