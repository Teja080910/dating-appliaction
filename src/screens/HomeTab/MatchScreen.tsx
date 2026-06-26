import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import useSubscriptionGate from '../../utils/useSubscriptionGate';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Shadows, Typography } from '../../theme';

const { width } = Dimensions.get('window');
const avatarSize = Math.min(width * 0.34, 140);

const MatchScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { requireSubscription } = useSubscriptionGate();

  const { matchedUser } = route.params as any || {
    matchedUser: {
      name: 'User',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
    }
  };

  return (
    <LinearGradient
      colors={[Colors.primary, Colors.secondary, '#5B21B6']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.sparkleContainer}>
              <Icon name="heart" size={24} color={Colors.white} style={styles.sparkleIcon} />
            </View>
            <Text style={styles.title}>It's a Match!</Text>
            <Text style={styles.subtitle}>You and {matchedUser.name} liked each other</Text>

            <View style={styles.avatarContainer}>
              <View style={[styles.avatarWrapper, styles.myAvatar]}>
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  style={styles.avatarBorder}
                >
                  <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=200&auto=format&fit=crop' }}
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
                    source={{ uri: matchedUser.image }}
                    style={styles.avatar}
                  />
                </LinearGradient>
              </View>
            </View>

            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => requireSubscription(() => navigation.goBack())}
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
