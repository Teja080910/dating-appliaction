import React, { useContext, useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import useSubscriptionGate from '../../utils/useSubscriptionGate';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppContext from '../../context/CreateGlobalStateContext';
import { getAbsoluteUrl } from '../../api/apiClient';
import { Colors, Spacing, Shadows } from '../../theme';

const { width } = Dimensions.get('window');
const avatarSize = Math.min(width * 0.34, 140);

const FALLBACK_MATCH_IMAGE = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop';

const normalizeImageUri = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim()) {
    const trimmed = value.trim();
    return /^(https?:\/\/|file:\/\/|content:\/\/|asset:\/\/|ph:\/\/|data:)/i.test(trimmed)
      ? trimmed
      : getAbsoluteUrl(trimmed);
  }
  return null;
};

const MatchScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { requireSubscription } = useSubscriptionGate();
  const { profileImageUrl, profileImage, images } = useContext(AppContext);

  const params = route.params as any;
  const matchedUser = params?.matchedUser || { name: 'User', image: null };

  const matchedImage = useMemo(() => {
    const image =
      normalizeImageUri(matchedUser?.image) ||
      normalizeImageUri(matchedUser?.profileImageUrl) ||
      normalizeImageUri(matchedUser?.images) ||
      FALLBACK_MATCH_IMAGE;
    return image;
  }, [matchedUser?.image, matchedUser?.profileImageUrl, matchedUser?.images]);

  const myImage = useMemo(() => {
    const imageList = Array.isArray(images) ? images : [];
    const firstImage = imageList.find((img) => typeof img === 'string' && img.trim());
    return (
      normalizeImageUri(profileImageUrl) ||
      normalizeImageUri(profileImage) ||
      normalizeImageUri(firstImage) ||
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=200&auto=format&fit=crop'
    );
  }, [profileImageUrl, profileImage, images]);

  const theirName = matchedUser?.name || 'User';

  return (
    <LinearGradient
      colors={[Colors.primary, Colors.secondary, Colors.primaryDark]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.sparkleContainer}>
              <Icon name="heart" size={24} color={Colors.white} style={styles.sparkleIcon} />
            </View>
            <Text style={styles.title}>It's a Match!</Text>
            <Text style={styles.subtitle}>You and {theirName} liked each other</Text>

            <View style={styles.avatarContainer}>
              <View style={[styles.avatarWrapper, styles.myAvatar]}>
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  style={styles.avatarBorder}
                >
                  <Image
                    source={{ uri: myImage }}
                    style={styles.avatar}
                  />
                </LinearGradient>
              </View>
              <View style={[styles.avatarWrapper, styles.theirAvatar]}>
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  style={styles.avatarBorder}
                >
                  <Image
                    source={{ uri: matchedImage }}
                    style={styles.avatar}
                  />
                </LinearGradient>
              </View>
            </View>

            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => requireSubscription(() => (navigation as any).navigate('ChatDetailScreen', { name: theirName, image: matchedImage }))}
              >
                <Icon name="message-circle" size={20} color={Colors.primary} style={styles.icon} />
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
