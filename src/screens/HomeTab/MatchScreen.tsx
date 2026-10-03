import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
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
  const { width, height } = useWindowDimensions();

  const isCompact = height < 740;
  const avatarSize = Math.min(width * (isCompact ? 0.28 : 0.34), isCompact ? 110 : 140);

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
            <View style={[styles.sparkleContainer, isCompact && styles.sparkleContainerCompact]}>
              <Icon
                name="heart"
                size={isCompact ? 20 : 24}
                color={Colors.white}
                style={styles.sparkleIcon}
              />
            </View>
            <Text style={[styles.title, isCompact && styles.titleCompact]}>Invitation Sent! 💌</Text>
            <Text style={[styles.subtitle, isCompact && styles.subtitleCompact]}>
              We've notified {theirName}. Once she accepts, her Telegram handle will appear in your Sent Invitations.
            </Text>

            <View style={[styles.avatarContainer, { minHeight: avatarSize + 20, marginBottom: isCompact ? 32 : 48 }]}>
              <View style={[styles.avatarWrapper, styles.myAvatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  style={[styles.avatarBorder, { borderRadius: avatarSize / 2 }]}
                >
                  <Image
                    source={mySource}
                    style={[styles.avatar, { borderRadius: avatarSize / 2 - 3 }]}
                    onError={() => setMyImageFailed(true)}
                  />
                </LinearGradient>
              </View>
              <View style={[styles.avatarWrapper, styles.theirAvatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  style={[styles.avatarBorder, { borderRadius: avatarSize / 2 }]}
                >
                  <Image
                    source={theirSource}
                    style={[styles.avatar, { borderRadius: avatarSize / 2 - 3 }]}
                    onError={() => setMyImageFailed(true)}
                  />
                </LinearGradient>
              </View>
            </View>

            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[styles.primaryButton, isCompact && styles.primaryButtonCompact]}
                onPress={() => {
                  try {
                    (navigation as any).navigate('BottomTabs', { screen: 'Sent' });
                  } catch {
                    try {
                      (navigation as any).navigate('SentRequestsScreen');
                    } catch {
                      (navigation as any).navigate('Sent');
                    }
                  }
                }}
              >
                <Icon
                  name="send"
                  size={20}
                  color={Colors.primary}
                  style={styles.icon}
                />
                <Text style={styles.primaryButtonText}>View Sent Invitations</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.secondaryButtonText}>Keep Browsing</Text>
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
    paddingVertical: Spacing.xl,
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
  sparkleContainerCompact: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: Spacing.sm,
  },
  sparkleIcon: {
    opacity: 0.9,
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: Colors.white,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: 28,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 44,
    textAlign: 'center',
    lineHeight: 22,
  },
  subtitleCompact: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 19,
  },
  avatarContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  avatarWrapper: {
    overflow: 'hidden',
    ...Shadows.xl,
  },
  avatarBorder: {
    flex: 1,
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
    resizeMode: 'cover',
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.md,
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
  primaryButtonCompact: {
    paddingVertical: Spacing.md,
  },
  icon: {
    marginRight: Spacing.md,
  },
  primaryButtonText: {
    color: Colors.primary,
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: Spacing.md,
  },
  secondaryButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default MatchScreen;
