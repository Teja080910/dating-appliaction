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
import { Colors } from '../../utils/colors';
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
      .then((token) => {
        if (isMounted) {
          setAuthToken(token);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAuthToken(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const resolvedFallbackAsset = useMemo(() => {
    if (fallbackAsset) {
      return fallbackAsset;
    }

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
        id,
        targetUserId: id,
        displayName: safeName,
        age: safeAge,
        currentCity: safeDistance,
        online: isOnline,
        isNew,
        profileImageUrl: safeImage,
      },
      image: safeImage,
      fallbackImage: resolvedFallbackAsset,
    });
  };

  return (
    <Pressable onPress={handleUserCard}>
      <View style={styles.card}>
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
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.gradient}
        >
          <View style={styles.infoContainer}>
            {/* NAME + AGE */}
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {safeName},{' '}
                <Text style={styles.age}>{safeAge}</Text>
              </Text>

              {/* VERIFIED ICON (optional) */}
              <Icon
                name="check-circle"
                size={14}
                color="#fff"
                style={styles.verifiedIcon}
              />
            </View>

            {/* STATUS */}
            <View style={styles.statusRow}>
              {isOnline ? (
                <View style={styles.onlineContainer}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.statusText}>
                    Recently online
                  </Text>
                </View>
              ) : null}

              {isNew ? (
                <View style={styles.newContainer}>
                  <Text style={styles.statusText}>New</Text>
                </View>
              ) : null}
            </View>

            {/* DISTANCE */}
            <View style={styles.distanceRow}>
              <Icon
                name="navigation"
                size={12}
                color="#fff"
                style={styles.navIcon}
              />
              <Text style={styles.distance}>
                {safeDistance}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    </Pressable>
  );
};

export default UserCard;

// ================= STYLES =================
const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: 240,
    borderRadius: 16,
    backgroundColor: '#fff',
    overflow: 'hidden',
    marginBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
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
    height: 100,
    justifyContent: 'flex-end',
    padding: 12,
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
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  age: {
    fontWeight: 'normal',
  },
  verifiedIcon: {
    marginLeft: 6,
    marginTop: 2,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navIcon: {
    marginRight: 4,
    transform: [{ rotate: '45deg' }],
  },
  distance: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  onlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 6,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.green,
    marginRight: 4,
  },
  newContainer: {
    backgroundColor: Colors.pink,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
