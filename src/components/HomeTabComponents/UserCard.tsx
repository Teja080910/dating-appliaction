import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  ImageSourcePropType,
  StyleSheet,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootParamList } from '../../utils/types/navigation.types';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import { Colors, Spacing, Shadows, useTheme } from '../../theme';
import { getAuthToken } from '../../utils/sessionHelper';

import { getAbsoluteUrl, isApiHostedUrl } from '../../api/apiClient';

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
  cardWidth?: number;
  cardHeight?: number;
}

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
  cardWidth,
  cardHeight,
}: UserCardProps) => {
  const { themeColors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const resolvedWidth = cardWidth || Math.floor((windowWidth - 45) / 2);
  const resolvedHeight = cardHeight || Math.round(Math.min(Math.max(resolvedWidth * 1.34, 220), 340));


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

  const safeName = (name ? String(name).replace(/,\s*\d+$/, '').trim() : '') || 'User';
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

  const safeImage = !imageFailed && normalizedImage ? getAbsoluteUrl(normalizedImage) : null;
  const imageSource: ImageSourcePropType | null = safeImage
    ? isApiHostedUrl(safeImage)
      ? {
          uri: safeImage,
          headers: {
            'ngrok-skip-browser-warning': '69420',
            'User-Agent': 'AMARA-App',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
        }
      : { uri: safeImage }
    : null;

  const handleUserCard = () => {
    setCardUserName(safeName);
    setCardUserAge(safeAge);
    setViewMyProfile(false);
    setSelectedUserImage(safeImage);

    const rawProfile = profileData?.profile || profileData || {};
    const targetUserId = id || rawProfile?.userId || rawProfile?.id;
    const fullProfileData = {
      ...rawProfile,
      id: targetUserId,
      userId: targetUserId,
      targetUserId: targetUserId,
      name: safeName,
      displayName: safeName,
      age: safeAge,
      gender: rawProfile?.gender || 'woman',
      bio: rawProfile?.bio || '',
      currentCity: safeDistance,
      online: isOnline,
      isNew,
      profileImageUrl: safeImage || rawProfile?.profileImageUrl || (rawProfile?.photos && rawProfile.photos[0]),
      image: safeImage || rawProfile?.profileImageUrl || (rawProfile?.photos && rawProfile.photos[0]),
      photos: rawProfile?.photos || (safeImage ? [safeImage] : []),
      images: rawProfile?.photos || rawProfile?.images || (safeImage ? [safeImage] : []),
    };

    navigation.navigate('ViewMyProfileScreen', {
      userId: targetUserId,
      targetUserId: targetUserId,
      profileData: fullProfileData,
      image: safeImage,
      fallbackImage: resolvedFallbackAsset,
    });
  };

  const formatDistanceDisplay = (val: string) => {
    if (!val || val === 'Nearby') return 'Nearby';
    const trimmed = String(val).trim();
    if (trimmed.toLowerCase().includes('away')) return trimmed;
    if (/^\d+(\.\d+)?$/.test(trimmed)) return `${trimmed} km away`;
    if (/^\d+(\.\d+)?\s*km$/i.test(trimmed)) return `${trimmed} away`;
    return `${trimmed} away`;
  };

  const formattedDistance = formatDistanceDisplay(safeDistance);

  return (
    <Pressable onPress={handleUserCard} style={styles.cardOuter}>
      <View style={[styles.card, { width: resolvedWidth, height: resolvedHeight, backgroundColor: themeColors.surface }]}>
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
            colors={['transparent', 'rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.85)']}
            locations={[0, 0.5, 1]}
            style={styles.gradient}
          >
            <View style={styles.infoContainer}>
              <Text style={styles.name} numberOfLines={1}>
                {safeName}, {safeAge}
              </Text>

              <View style={styles.distanceRow}>
                <Icon name="map-pin" size={11} color="rgba(255, 255, 255, 0.9)" style={styles.pinIcon} />
                <Text style={styles.distance} numberOfLines={1}>
                  {formattedDistance}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Pressable>
  );
};

export default UserCard;

const styles = StyleSheet.create({
  cardOuter: {
    marginBottom: 14,
    borderRadius: 16,
    ...Shadows.card,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  cardInner: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
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
    height: 90,
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  infoContainer: {
    flexDirection: 'column',
  },
  name: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinIcon: {
    marginRight: 4,
  },
  distance: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 12,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
