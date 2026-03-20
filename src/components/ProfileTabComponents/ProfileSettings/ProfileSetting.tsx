import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import { RootParamList } from '../../../utils/types/navigation.types';
import { StackNavigationProp } from '@react-navigation/stack';

const ProfileSetting = () => {
  const navigation = useNavigation<StackNavigationProp<RootParamList,'ProfileSettingsScreen'>>();
  const handlePress = () => {
    navigation.navigate('ProfileSettingsScreen');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>ACCOUNT SETTINGS</Text>
      <TouchableOpacity style={styles.itemRow} onPress={handlePress}>
        <View style={styles.iconWrapper}>
          <Icon name="cog" solid size={16} color="#fff" />
        </View>
        <Text style={styles.itemText}>Profile settings</Text>
        <Icon name="chevron-right" size={16} color="#c4c4c4" />
      </TouchableOpacity>
    </View>
  );
};

export default ProfileSetting;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    textTransform: 'uppercase',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FF5A79',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemText: {
    fontSize: 16,
    color: '#111',
    flex: 1,
    fontWeight: '500',
  },
});
