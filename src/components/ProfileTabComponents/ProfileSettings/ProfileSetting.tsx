import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import { RootParamList } from '../../../utils/types/navigation.types';
// import { NativeStackNavigatorProps } from '@react-navigation/native-stack';
import { StackNavigationProp } from '@react-navigation/stack';

const ProfileSetting = () => {
  const navigation = useNavigation<StackNavigationProp<RootParamList>>();

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>PROFILE</Text>
      <TouchableOpacity style={styles.itemRow} onPress={() => navigation.navigate('ProfileSettingsScreen')}>
        <Icon name="cog" solid size={20} color="#1c1c1e" style={styles.icon} />
        <Text style={styles.itemText}>Profile settings</Text>
        <Icon name="chevron-right" size={16} color="#c4c4c4" style={styles.chevron} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.itemRow} onPress={() => navigation.navigate('Notifications')}>
        <Icon name="bell" solid size={20} color="#1c1c1e" style={styles.icon} />
        <Text style={styles.itemText}>Notifications</Text>
        <Icon name="chevron-right" size={16} color="#c4c4c4" style={styles.chevron} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.itemRow} onPress={() => navigation.navigate('PrivacyStatus')}>
        <Icon name="shield-alt" solid size={20} color="#1c1c1e" style={styles.icon} />
        <Text style={styles.itemText}>Privacy status</Text>
        <Icon name="chevron-right" size={16} color="#c4c4c4" style={styles.chevron} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f2f2f2',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#a0a0a0',
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  icon: {
    marginRight: 12,
  },
  itemText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  chevron: {
    marginLeft: 8,
  },
});

export default ProfileSetting;
