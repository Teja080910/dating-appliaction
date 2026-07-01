import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import AuthImage from '../AuthImage';
import AppContext from '../../context/CreateGlobalStateContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootParamList } from '../../utils/types/navigation.types';
import { User } from '../../api/types';

interface UserCardProps {
  name: string;
  age: number;
  image: string;
  distance: string;
  userId: number;
  userUserId?: string;
  userData?: User;
}

const CARD_WIDTH = (Dimensions.get('window').width - 45) / 2;

const UserCard = ({ name, age, image, distance, userId, userUserId, userData }: UserCardProps) => {
  const navigation = useNavigation<StackNavigationProp<RootParamList>>();
  const {
    setViewMyProfile,
    setSelectedUserImage,
    setCardUserName,
    setCardUserAge,
  } = useContext(AppContext);

  const handleUserCard = () => {
    setCardUserName(name);
    setCardUserAge(age);
    setViewMyProfile(false);
    setSelectedUserImage(image);
    navigation.navigate('ViewMyProfileScreen', { userId, userUserId, userData });
  };

  return (
    <Pressable onPress={handleUserCard}>
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          {image ? (
            <AuthImage uri={image} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.placeholder]}>
              <Text style={styles.placeholderText}>{name?.charAt(0) || '?'}</Text>
            </View>
          )}
          <View style={styles.overlayText}>
            <Text style={styles.name}>
              {name}, {age}
            </Text>
            <Text style={styles.distance}>{distance}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
    marginBottom: 15,
    marginHorizontal: 7.5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: { position: 'relative' },
  image: {
    width: '100%',
    height: 170,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  placeholder: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: { fontSize: 40, color: '#999' },
  overlayText: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  name: { color: '#fff', fontSize: 16, fontWeight: '600' },
  distance: { color: 'white' },
});

export default UserCard;
