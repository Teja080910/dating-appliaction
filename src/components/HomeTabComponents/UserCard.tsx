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
import { resolveImageUri } from '../../utils/imageUtils';

interface UserCardProps {
  name: string;
  age: number;
  image: string;
  city: string;
  bio: string;
  userId: number;
  userUserId?: string;
  userData?: User;
}

const CARD_WIDTH = (Dimensions.get('window').width - 30) / 2;

const UserCard = ({ name, age, image, city, bio, userId, userUserId, userData }: UserCardProps) => {
  const navigation = useNavigation<StackNavigationProp<any>>();
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
            <AuthImage uri={resolveImageUri(image)} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.placeholder]}>
              <Text style={styles.placeholderText}>{name?.charAt(0) || '?'}</Text>
            </View>
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {name}{age ? `, ${age}` : ''}
          </Text>
          {city ? (
            <Text style={styles.city} numberOfLines={1}>{city}</Text>
          ) : null}
          {bio ? (
            <Text style={styles.bio} numberOfLines={2}>{bio}</Text>
          ) : null}
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
    height: 180,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  placeholder: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: { fontSize: 40, color: '#999' },
  info: {
    padding: 10,
  },
  name: { fontSize: 15, fontWeight: '700', color: '#000' },
  city: { fontSize: 13, color: '#888', marginTop: 2 },
  bio: { fontSize: 12, color: '#666', marginTop: 4, lineHeight: 16 },
});

export default UserCard;
