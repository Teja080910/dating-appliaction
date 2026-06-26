import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootParamList } from '../../utils/types/navigation.types';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import { Colors, Spacing, Shadows } from '../../theme';
import { getAuthToken } from '../../utils/sessionHelper';
import { isApiHostedUrl } from '../../api/apiClient';

interface UserCardProps {
  name?: string;
  age?: number | string;
  image?: string | null;
  fallbackAsset?: any;
  profileData?: any;
  distance?: string;
  isOnline?: boolean;
  isNew?: boolean;
  id?: string | number;
}

const CARD_WIDTH = (Dimensions.get('window').width - 45) / 2;

const FALLBACK_IMAGES = [
  require('../../assets/MessageTabImages/girl1.webp'),
  require('../../assets/MessageTabImages/girl2.webp'),
  require('../../assets/MessageTabImages/girl3.webp'),
  require('../../assets/MessageTabImages/boy1.webp'),
  require('../../assets/MessageTabImages/boy2.webp'),
  require('../../assets/MessageTabImages/boy3.webp'),
];

const SUPPORTED_IMAGE_URI_REGEX = /^(https?:\/\/|file:\/\/|content:\/\/|asset:\/\/|ph:\/\/|data:)/i;

const UserCard = ({
  name,
  age,
  image,
  fallbackAsset,
  profileData,
  distance,
  isOnline,
  isNew,
  id,
}: UserCardProps) => {
  const navigation =
    useNavigation<StackNavigationProp<RootParamList, 'ViewMyProfileScreen'>>();

  const {
    setViewMyProfile,
    setSelectedUserImage,
    setCardUserName,
    setCardUserAge,
  } = useContext(AppContext);

  const [imageFailed, setImageFailed] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const safeName = name || 'User';
  const safeAge = age || 'N/A';
  const normalizedImage =
    typeof image === 'string' && SUPPORTED_IMAGE_URI_REGEX.test(image.trim())
      ? image.trim()
      : null;
  const safeDistance = distance || 'Nearby';

  useEffect(() => {
    setImageFailed(false);
  }, [normalizedImage]);

  useEffect(() => {
    let isMounted = true;
    getAuthToken()
      .then((token) => { if (isMounted) setAuthToken(token); })
      .catch(() => { if (isMounted) setAuthToken(null); });
    return () => { isMounted = false; };
  }, []);

  const resolvedFallbackAsset = useMemo(() => {
    if (fallbackAsset) return fallbackAsset;
    const seedValue = String(id || safeName)
      .split('')
      .reduce((total, char) => total + char.charCodeAt(0), 0);
    return FALLBACK_IMAGES[seedValue % FALLBACK_IMAGES.length];
  }, [fallbackAsset, id, safeName]);

  const safeImage = !imageFailed ? normalizedImage : null;
  const imageSource: ImageSourcePropType | null = safeImage
    ? authToken && isApiHostedUrl(safeImage)
      ? { uri: safeImage, headers: { Authorization: `Bearer ${authToken}` } }
      : { uri: safeImage }
    : null;

  const handleUserCard = () => {
    setCardUserName(safeName);
    setCardUserAge(safeAge);
    setViewMyProfile(false);
    setSelectedUserImage(safeImage);
    navigation.navigate('ViewMyProfileScreen', {
      userId: id,
      targetUserId: id,
      profileData: profileData || {
        id, targetUserId: id, displayName: safeName, age: safeAge,
        currentCity: safeDistance, online: isOnline, isNew,
        profileImageUrl: safeImage,
      },
      image: safeImage,
      fallbackImage: resolvedFallbackAsset,
    });
  };

  return (
    <Pressable onPress={handleUserCard} style={styles.cardOuter}>
      <View style={styles.card}>
        <LinearGradient
          colors={[Colors.gradientCard[0], Colors.gradientCard[1]]}
          style={styles.cardBorder}
        >
          <View style={styles.cardInner}>
            {safeImage ? (
              <Image
                source={imageSource as ImageSourcePropType}
                style={styles.image}
                onError={() => setImageFailed(true)}
              />
            ) : (
              <Image source={resolvedFallbackAsset} style={styles.image} />
            )}

            <LinearGradient
              colors={['transparent', 'rgba(15, 13, 26, 0.95)']}
              style={styles.gradient}
            >
              <View style={styles.infoContainer}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {safeName}, <Text style={styles.age}>{safeAge}</Text>
                  </Text>
                  <Icon name="check-circle" size={14} color={Colors.primaryLight} style={styles.verifiedIcon} />
                </View>

                <View style={styles.statusRow}>
                  {isOnline && (
                    <View style={styles.onlineContainer}>
                      <View style={styles.onlineDot} />
                      <Text style={styles.statusText}>Online</Text>
                    </View>
                  )}
                  {isNew && (
                    <View style={styles.newContainer}>
                      <Text style={styles.statusText}>New</Text>
                    </View>
                  )}
                </View>

                <View style={styles.distanceRow}>
                  <Icon name="navigation" size={11} color={Colors.textSecondary} style={styles.navIcon} />
                  <Text style={styles.distance}>{safeDistance}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </LinearGradient>
      </View>
    </Pressable>
  );
};

export default UserCard;

const styles = StyleSheet.create({
  cardOuter: {
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  card: {
    width: CARD_WIDTH,
    height: 250,
    borderRadius: Spacing.radiusLg,
    overflow: 'hidden',
  },
  cardBorder: {
    flex: 1,
    borderRadius: Spacing.radiusLg,
    padding: 1,
  },
  cardInner: {
    flex: 1,
    borderRadius: Spacing.radiusLg - 1,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    justifyContent: 'flex-end',
    padding: Spacing.md,
  },
  infoContainer: {
    flexDirection: 'column',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '700',
    flexShrink: 1,
  },
  age: {
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  verifiedIcon: {
    marginLeft: 6,
    marginTop: 2,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  navIcon: {
    marginRight: 4,
    transform: [{ rotate: '45deg' }],
  },
  distance: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  onlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glass,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Spacing.radiusFull,
    marginRight: 6,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.online,
    marginRight: 4,
  },
  newContainer: {
    backgroundColor: Colors.badge,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Spacing.radiusFull,
  },
  statusText: {
    color: Colors.text,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
