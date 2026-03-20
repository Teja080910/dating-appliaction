import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface ProfileRowProps {
  title: string;
  iconName: string;
  iconType?: 'Feather' | 'FontAwesome5' | 'MaterialCommunityIcons';
  onPress?: () => void;
  color?: string;
  showChevron?: boolean;
}

const ProfileRow = ({ 
  title, 
  iconName, 
  iconType = 'Feather', 
  onPress, 
  color = '#FF5A79',
  showChevron = true 
}: ProfileRowProps) => {

  const renderIcon = () => {
    switch (iconType) {
      case 'FontAwesome5':
        return <FontAwesome5 name={iconName} size={16} color="#fff" />;
      case 'MaterialCommunityIcons':
        return <MaterialCommunityIcons name={iconName} size={18} color="#fff" />;
      default:
        return <Icon name={iconName} size={18} color="#fff" />;
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconWrapper, { backgroundColor: color }]}>
        {renderIcon()}
      </View>
      <Text style={styles.text}>{title}</Text>
      {showChevron && <Icon name="chevron-right" size={18} color="#CCC" />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  text: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});

export default ProfileRow;
