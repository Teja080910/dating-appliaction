import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useContext } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import AppContext from '../../../context/CreateGlobalStateContext';
import { Colors } from '../../../theme';
import { RootParamList } from '../../../utils/types/navigation.types';

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
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder
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
    color: Colors.text,
    fontWeight: '500'
  },
  chevron: {}
});

export default ViewMyProfile;
