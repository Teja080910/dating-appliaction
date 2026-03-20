import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const InviteButton = () => {
  const navigation = useNavigation<any>();

  const handlePress = () => {
    // Navigate to the Home tab to let user discover people
    console.log('Navigating to Home to invite people...');
    navigation.navigate('Home');
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.8} 
      style={styles.button} 
      onPress={handlePress}
    >
      <Icon name="heart-flash" size={20} color="#fff" style={styles.icon} />
      <Text style={styles.text}>Invite now</Text>
    </TouchableOpacity>
  );
};

export default InviteButton;

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FF5A79',
    height: 56,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    marginTop: 10,
    elevation: 4,
    shadowColor: '#FF5A79',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
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
