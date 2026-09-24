import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ImageSourcePropType,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import useSubscriptionGate from '../../utils/useSubscriptionGate';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppContext from '../../context/CreateGlobalStateContext';
import { getAbsoluteUrl, isApiHostedUrl } from '../../api/apiClient';
import { Colors, Spacing, Shadows } from '../../theme';
import { getAuthToken } from '../../utils/sessionHelper';

const { width } = Dimensions.get('window');
const avatarSize = Math.min(width * 0.34, 140);

const FALLBACK_IMAGES = [
  require('../../assets/MessageTabImages/girl1.webp'),
  require('../../assets/MessageTabImages/girl2.webp'),
  require('../../assets/MessageTabImages/girl3.webp'),
  require('../../assets/MessageTabImages/boy1.webp'),
  require('../../assets/MessageTabImages/boy2.webp'),
  require('../../assets/MessageTabImages/boy3.webp'),
];

const getFallbackAsset = (seed: string | number = 'user') => {
  const seedNum = String(seed)
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return FALLBACK_IMAGES[seedNum % FALLBACK_IMAGES.length];
};

const extractFirstImagePath = (value: unknown): string | null => {
  if (!value) return null;
  if (typeof value === 'string') return value.trim() || null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const candidate = extractFirstImagePath(item);
      if (candidate) return candidate;
    }
    return null;
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return (
      extractFirstImagePath(obj.imageUrl) ||
      extractFirstImagePath(obj.profileImageUrl) ||
      extractFirstImagePath(obj.url) ||
      extractFirstImagePath(obj.uri) ||
      extractFirstImagePath(obj.path) ||
      null
    );
  }
  return null;
};

const MatchScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { requireSubscription } = useSubscriptionGate();
  const { profileImageUrl, profileImage, images } = useContext(AppContext);

  const [myImageFailed, setMyImageFailed] = useState(false);
  const [theirImageFailed, setTheirImageFailed] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getAuthToken()
      .then((token) => {
        if (isMounted) setAuthToken(token);
      })
      .catch(() => {
        if (isMounted) setAuthToken(null);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const params = route.params as any;
  const matchedUser = params?.matchedUser || { name: 'User', image: null };
  const theirName = matchedUser?.name || matchedUser?.displayName || 'User';

  const rawTheirImage = useMemo(() => {
    const candidate = [
      matchedUser?.image,
      matchedUser?.profileImageUrl,
      matchedUser?.imageUrl,
      matchedUser?.images,
      matchedUser?.profile?.profileImageUrl,
      matchedUser?.profile?.imageUrl,
      matchedUser?.profile?.images,
    ]
      .map(extractFirstImagePath)
      .find(Boolean);

    return candidate ? getAbsoluteUrl(candidate) : null;
  }, [matchedUser]);

  const rawMyImage = useMemo(() => {
    const candidate = [
      profileImageUrl,
      profileImage,
      images,
    ]
      .map(extractFirstImagePath)
      .find(Boolean);

    return candidate ? getAbsoluteUrl(candidate) : null;
  }, [profileImageUrl, profileImage, images]);

  const myFallback = useMemo(() => getFallbackAsset('my-profile'), []);
  const theirFallback = useMemo(
    () => getFallbackAsset(matchedUser?.id || theirName),
    [matchedUser?.id, theirName],
  );

  const mySource: ImageSourcePropType = useMemo(() => {
    if (!myImageFailed && rawMyImage) {
      if (isApiHostedUrl(rawMyImage) && authToken) {
        return {
          uri: rawMyImage,
          headers: { Authorization: `Bearer ${authToken}` },
        };
      }
      return { uri: rawMyImage };
    }
    return myFallback;
  }, [myImageFailed, rawMyImage, authToken, myFallback]);

  const theirSource: ImageSourcePropType = useMemo(() => {
    if (!theirImageFailed && rawTheirImage) {
      if (isApiHostedUrl(rawTheirImage) && authToken) {
        return {
          uri: rawTheirImage,
          headers: { Authorization: `Bearer ${authToken}` },
        };
      }
      return { uri: rawTheirImage };
    }
    return theirFallback;
  }, [theirImageFailed, rawTheirImage, authToken, theirFallback]);

  return (
    <LinearGradient
      colors={[Colors.primary, Colors.secondary, Colors.primaryDark]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.sparkleContainer}>
              <Icon
                name="heart"
                size={24}
                color={Colors.white}
                style={styles.sparkleIcon}
              />
            </View>
            <Text style={styles.title}>It's a Match!</Text>
            <Text style={styles.subtitle}>
              You and {theirName} liked each other
            </Text>

            <View style={styles.avatarContainer}>
              <View style={[styles.avatarWrapper, styles.myAvatar]}>
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  style={styles.avatarBorder}
                >
                  <Image
                    source={mySource}
                    style={styles.avatar}
                    onError={() => setMyImageFailed(true)}
                  />
                </LinearGradient>
              </View>
              <View style={[styles.avatarWrapper, styles.theirAvatar]}>
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  style={styles.avatarBorder}
                >
                  <Image
                    source={theirSource}
                    style={styles.avatar}
                    onError={() => setTheirImageFailed(true)}
                  />
                </LinearGradient>
              </View>
            </View>

            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() =>
                  requireSubscription(() =>
                    (navigation as any).navigate('ChatDetailScreen', {
                      name: theirName,
                      image: rawTheirImage,
                    }),
                  )
                }
              >
                <Icon
                  name="message-circle"
                  size={20}
                  color={Colors.primary}
                  style={styles.icon}
                />
                <Text style={styles.primaryButtonText}>Say Hello</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.secondaryButtonText}>Keep Swiping</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: '8%',
    paddingVertical: Spacing.xxl,
  },
  sparkleContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sparkleIcon: {
    opacity: 0.9,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: Colors.white,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 50,
    textAlign: 'center',
  },
  avatarContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: avatarSize + 40,
    width: '100%',
    marginBottom: 60,
  },
  avatarWrapper: {
    width: avatarSize,
    height: avatarSize,
    borderRadius: avatarSize / 2,
    overflow: 'hidden',
    ...Shadows.xl,
  },
  avatarBorder: {
    flex: 1,
    borderRadius: avatarSize / 2,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  myAvatar: {
    zIndex: 1,
    marginRight: -20,
  },
  theirAvatar: {
    zIndex: 2,
    marginLeft: -20,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: avatarSize / 2 - 3,
    resizeMode: 'cover',
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  primaryButton: {
    backgroundColor: Colors.white,
    width: '100%',
    paddingVertical: Spacing.lg,
    borderRadius: Spacing.radiusXl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
  },
  icon: {
    marginRight: Spacing.md,
  },
  primaryButtonText: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: Spacing.lg,
  },
  secondaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MatchScreen;
