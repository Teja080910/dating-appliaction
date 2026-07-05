import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome5';
import AuthImage from '../AuthImage';
import AppContext from '../../context/CreateGlobalStateContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootParamList } from '../../utils/types/navigation.types';
import { User } from '../../api/types';
import { resolveImageUri } from '../../utils/imageUtils';
import { colors, radius, shadow, typography } from '../../constants/theme';

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
    <Pressable onPress={handleUserCard} style={({ pressed }) => [pressed && styles.pressed]}>
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          {image ? (
            <AuthImage uri={resolveImageUri(image)} style={styles.image} />
          ) : (
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              style={[styles.image, styles.placeholder]}
            >
              <Text style={styles.placeholderText}>{name?.charAt(0)?.toUpperCase() || '?'}</Text>
            </LinearGradient>
          )}

          <LinearGradient
            colors={['transparent', 'rgba(36,17,26,0.15)', 'rgba(36,17,26,0.92)']}
            locations={[0, 0.5, 1]}
            style={styles.scrim}
          />

          <View style={styles.likeBadge}>
            <Icon name="heart" size={13} color="#fff" />
          </View>

          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {name}{age ? <Text style={styles.age}>, {age}</Text> : null}
            </Text>
            {city ? (
              <View style={styles.locationRow}>
                <Icon name="map-marker-alt" size={10} color="rgba(255,255,255,0.85)" />
                <Text style={styles.city} numberOfLines={1}> {city}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  card: {
    width: CARD_WIDTH,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    marginBottom: 16,
    marginHorizontal: 7.5,
    ...shadow.card,
  },
  imageContainer: { position: 'relative', height: 230 },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: { fontSize: 44, color: '#fff', fontWeight: '800' },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '65%',
  },
  likeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(36,17,26,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
  },
  name: { ...typography.heading, color: '#fff' },
  age: { fontWeight: '400' as const, color: 'rgba(255,255,255,0.9)' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  city: { fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },
});

export default UserCard;
