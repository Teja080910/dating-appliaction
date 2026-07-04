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
    borderRadius: 16,
    backgroundColor: '#fff',
    overflow: 'hidden',
    marginBottom: 16,
    marginHorizontal: 7.5,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  imageContainer: { position: 'relative' },
  image: {
    width: '100%',
    height: 200,
  },
  placeholder: {
    backgroundColor: 'linear-gradient(135deg, #E94057, #8A2387)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: { fontSize: 42, color: '#fff', fontWeight: '700' },
  info: {
    padding: 12,
    paddingTop: 10,
  },
  name: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  city: { fontSize: 13, color: '#888', marginTop: 3 },
  bio: { fontSize: 12, color: '#666', marginTop: 4, lineHeight: 16 },
});

export default UserCard;
