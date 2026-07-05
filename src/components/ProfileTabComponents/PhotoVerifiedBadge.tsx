import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AppContext from '../../context/CreateGlobalStateContext';
import { RootParamList } from '../../utils/types/navigation.types';

const PhotoVerifiedBadge = () => {
  const { verifiedSelfie } = useContext(AppContext);
  const navigation = useNavigation<StackNavigationProp<RootParamList>>();

  if (verifiedSelfie) {
    return (
      <View style={styles.badgeContainer}>
        <Icon name="check-circle" solid size={20} color="#d76d7c" style={styles.icon} />
        <Text style={styles.text}>You're verified by photo!</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.badgeContainer, styles.badgeContainerPending]}
      onPress={() => navigation.navigate('SelfieVerification')}
    >
      <Icon name="camera" solid size={18} color="#666" style={styles.icon} />
      <Text style={[styles.text, styles.textPending]}>Verify your photo</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f2f2f2',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f2f2f2',
  },
  badgeContainerPending: {
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 16,
    color: '#000',
  },
  textPending: {
    color: '#666',
  },
});

export default PhotoVerifiedBadge;
