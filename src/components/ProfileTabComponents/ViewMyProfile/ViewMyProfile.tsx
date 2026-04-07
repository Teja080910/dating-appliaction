import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Icon from 'react-native-vector-icons/Feather';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { RootParamList } from '../../../utils/types/navigation.types';
import AppContext from '../../../context/CreateGlobalStateContext';

const ViewMyProfile = () => {
  const navigation = useNavigation<StackNavigationProp<RootParamList>>();
  const { setViewMyProfile } = useContext(AppContext);
  
  const onPress = () => {
    setViewMyProfile(true);
    navigation.navigate('ViewMyProfileScreen', {});
  };

  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={styles.left}>
        <FontAwesome5 name="user" size={20} style={styles.icon} />
        <Text style={styles.text}>View my profile</Text>
      </View>
      <Icon name="chevron-right" size={23} color="#c4c4c4" style={styles.chevron} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
    color: '#FF5A79',
  },
  text: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500'
  },
  chevron: {}
});

export default ViewMyProfile;
