import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
  RefreshControl,
  TextInput,
  Dimensions,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useConnection, ConnectionRequest } from '../../api/useConnection';
import AppContext from '../../context/CreateGlobalStateContext';
import { Colors, Spacing, useTheme } from '../../theme';

const SentRequestsScreen: React.FC = () => {
  const { themeColors, isDark } = useTheme();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const canGoBack = Boolean(navigation?.canGoBack?.());
  const { setViewMyProfile, setCardUserName, setCardUserAge, setSelectedUserImage } =
    useContext(AppContext);
  const { sentList, refreshAll } = useConnection();
  const [searchQuery, setSearchQuery] = useState('');


  const { data: requests = [], isLoading, isRefetching } = sentList;

  const sortedRequests = [...requests].sort((a, b) => {
    const aTime = new Date(a.createdAt || a.updatedAt || 0).getTime();
    const bTime = new Date(b.createdAt || b.updatedAt || 0).getTime();
    return bTime - aTime;
  });
  const formatRequestTime = (value?: string | null) => {
    if (!value) return 'Time unavailable';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Time unavailable';
    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  };

  const displayedRequests = searchQuery.trim()
    ? sortedRequests.filter((r) => {
        const receiver = r.receiver || {};
        const q = searchQuery.toLowerCase().trim();
        const name = (receiver.displayName || receiver.name || '').toLowerCase();
        const city = (receiver.city || receiver.currentCity || '').toLowerCase();
        return name.includes(q) || city.includes(q);
      })
    : sortedRequests;

  const cleanDisplayName = (name?: string) => {
    if (!name) return 'User';
    return String(name).replace(/,\s*\d+$/, '').trim() || 'User';
  };

  const handleOpenTelegram = (username?: string) => {
    if (!username) {
      Alert.alert('Telegram not connected', 'They have not connected Telegram yet. You can still keep in touch here.');
      return;
    }
    const cleanUsername = username.replace('@', '');
    const url = `https://t.me/${cleanUsername}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Open Link', `Open in browser: ${url}`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open', onPress: () => Linking.openURL(url) },
          ]);
        }
      })
      .catch(() => {
        Linking.openURL(url);
      });
  };

  const handleShareTelegram = async (username?: string) => {
    if (!username) {
      Alert.alert('Telegram not connected', 'No username available to share.');
      return;
    }
    const cleanUsername = username.replace('@', '');
    try {
      await Share.share({
        message: `@${cleanUsername} (https://t.me/${cleanUsername})`,
      });
    } catch {
      // User dismissed share dialog
    }
  };

  const handleOpenProfile = (item: ConnectionRequest) => {
    const receiver = item.receiver || {};
    const targetUserId = receiver.id || receiver.userId || (item as any).receiverId;
    const photoUrl =
      receiver.photo ||
      (receiver.photos && receiver.photos[0]) ||
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800';

    const fullProfileData = {
      ...receiver,
      id: targetUserId,
      userId: targetUserId,
      targetUserId: targetUserId,
      name: cleanDisplayName(receiver.displayName || receiver.name),
      displayName: cleanDisplayName(receiver.displayName || receiver.name),
      age: receiver.age,
      gender: receiver.gender || 'woman',
      bio: receiver.bio || '',
      currentCity: receiver.city || receiver.currentCity || 'Nearby',
      photos: receiver.photos || (photoUrl ? [photoUrl] : []),
      images: receiver.photos || (photoUrl ? [photoUrl] : []),
      profileImageUrl: photoUrl,
      image: photoUrl,
      telegramUsername: receiver.telegramUsername || '',
      smoke: receiver.smoke,
      drink: receiver.drink,
      height: receiver.height,
      bodyType: receiver.bodyType,
      appearance: receiver.appearance,
      language: receiver.language,
      englishLevel: receiver.englishLevel,
      ethnicity: receiver.ethnicity,
      lookingFor: receiver.lookingFor,
    };

    setCardUserName(fullProfileData.name);
    setCardUserAge(String(fullProfileData.age || '24'));
    setViewMyProfile(false);
    setSelectedUserImage(photoUrl);

    navigation.navigate('ViewMyProfileScreen', {
      userId: targetUserId,
      targetUserId: targetUserId,
      profileData: fullProfileData,
      image: photoUrl,
    });
  };

  const renderItem = ({ item }: { item: ConnectionRequest }) => {
    const receiver = item.receiver || {};
    const photoUrl =
      receiver.photo ||
      (receiver.photos && receiver.photos[0]) ||
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800';
    const isApproved = item.status === 'APPROVED';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => handleOpenProfile(item)}
      >
        <Image source={{ uri: photoUrl }} style={styles.avatar} />

        <View style={styles.cardContent}>
          <View style={styles.nameRow}>
            <Text style={styles.nameText} numberOfLines={1}>
              {cleanDisplayName(receiver.displayName || receiver.name)}
              {receiver.age ? `, ${receiver.age}` : ''}
            </Text>

            {isApproved ? (
              <View style={styles.approvedActionRow}>
                <TouchableOpacity
                  style={styles.smallActionWrapper}
                  activeOpacity={0.8}
                  onPress={() => handleOpenTelegram(receiver.telegramUsername)}
                >
                  <LinearGradient
                    colors={[Colors.primary, Colors.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.smallActionGradient}
                  >
                    <Text style={styles.smallActionText}>Open Telegram</Text>
                  </LinearGradient>
                </TouchableOpacity>
                {receiver.telegramUsername ? (
                  <TouchableOpacity
                    style={styles.shareIconButton}
                    activeOpacity={0.7}
                    onPress={() => handleShareTelegram(receiver.telegramUsername)}
                    accessibilityLabel="Share Telegram Handle"
                  >
                    <Icon name="share-variant-outline" size={17} color={Colors.primary} />
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}
          </View>

          {isApproved && receiver.telegramUsername ? (
            <View style={styles.itemHandleRow}>
              <Text style={styles.itemHandleLabel}>Telegram: </Text>
              <Text selectable={true} style={styles.itemHandleText}>
                @{receiver.telegramUsername.replace('@', '')}
              </Text>
            </View>
          ) : null}

          {receiver.city ? (
            <Text style={styles.cityText} numberOfLines={1}>
              {receiver.city}
            </Text>
          ) : null}

          {receiver.bio ? (
            <Text style={styles.bioText} numberOfLines={1}>
              {receiver.bio}
            </Text>
          ) : null}
          <Text style={styles.metaText}>{formatRequestTime(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          {canGoBack && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="arrow-left" size={24} color={Colors.text} />
            </TouchableOpacity>
          )}
          <Text style={styles.screenTitle}>Sent Invitations</Text>
        </View>
        <Text style={styles.screenSubtitle}>Your sent invitations</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color={Colors.textMuted} />
        <TextInput
          placeholder="Search sent invitations by name or city..."
          style={styles.searchInput}
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading invitations...</Text>
        </View>
      ) : displayedRequests.length === 0 ? (
        <View style={styles.centerContainer}>
          <Icon
            name={searchQuery.trim() ? 'account-search-outline' : 'send-outline'}
            size={48}
            color={Colors.textMuted}
            style={{ marginBottom: Spacing.md }}
          />
          <Text style={styles.emptyTitle}>
            {searchQuery.trim() ? 'No Results Found' : 'No sent invitations yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery.trim()
              ? `No sent invitations match "${searchQuery.trim()}".`
              : 'Explore profiles and send an invitation when you find someone interesting.'}
          </Text>
          {searchQuery.trim().length > 0 && (
            <TouchableOpacity
              style={styles.clearSearchBtn}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.clearSearchBtnText}>Clear Search</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={displayedRequests}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refreshAll}
              tintColor={Colors.primary}
            />
          }
        />
      )}
    </View>
  );
};

export default SentRequestsScreen;

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      marginRight: 10,
      padding: 4,
    },
    screenTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
    },
    screenSubtitle: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      marginHorizontal: Spacing.lg,
      marginTop: Spacing.sm,
      marginBottom: Spacing.xs,
      paddingHorizontal: Spacing.md,
      borderRadius: 22,
      height: 42,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    searchInput: {
      flex: 1,
      color: colors.text,
      fontSize: 14,
      marginLeft: 8,
      paddingVertical: 0,
    },
    clearSearchBtn: {
      marginTop: Spacing.md,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 16,
      backgroundColor: colors.surfaceLight,
    },
    clearSearchBtnText: {
      color: colors.primary,
      fontWeight: '700',
      fontSize: 13,
    },
    listContent: {
      padding: Spacing.md,
      paddingBottom: 90,
    },
    card: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.surfaceLight,
    },
    cardContent: {
      flex: 1,
      marginLeft: Spacing.md,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    nameText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
      marginRight: 8,
    },
    smallActionWrapper: {
      borderRadius: 14,
      overflow: 'hidden',
    },
    smallActionGradient: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    smallActionText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '700',
    },
    cityText: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    bioText: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    metaText: {
      fontSize: 11,
      color: colors.textMuted,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
    },
    loadingText: {
      fontSize: 14,
      color: colors.textMuted,
      marginTop: Spacing.md,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    emptySubtitle: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 6,
      lineHeight: 18,
    },
    // Full Profile Modal
    modalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    modalBackBtn: {
      padding: Spacing.xs,
    },
    modalTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
    },
    modalScroll: {
      paddingBottom: 80,
      flexGrow: 1,
    },
    photoContainer: {
      width: '100%',
      maxWidth: 480,
      aspectRatio: 0.8,
      maxHeight: 520,
      alignSelf: 'center',
      backgroundColor: colors.surfaceLight,
      position: 'relative',
    },
    modalPhoto: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
      backgroundColor: colors.surfaceLight,
    },
    storyBarsContainer: {
      position: 'absolute',
      top: 10,
      left: 12,
      right: 12,
      flexDirection: 'row',
      gap: 5,
      zIndex: 10,
    },
    storyBarTrack: {
      flex: 1,
      height: 3,
      borderRadius: 2,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      overflow: 'hidden',
    },
    storyBarFill: {
      flex: 1,
      borderRadius: 2,
    },
    tapZoneLeft: {
      position: 'absolute',
      top: 25,
      left: 0,
      bottom: 25,
      width: '45%',
      zIndex: 5,
    },
    tapZoneRight: {
      position: 'absolute',
      top: 25,
      right: 0,
      bottom: 25,
      width: '55%',
      zIndex: 5,
    },
    photoCountBadge: {
      position: 'absolute',
      bottom: 12,
      right: 14,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      zIndex: 10,
    },
    photoCountText: {
      color: '#fff',
      fontSize: 11,
      fontWeight: '700',
    },
    modalInfo: {
      padding: Spacing.lg,
    },
    modalNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    modalName: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
    },
    modalCity: {
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 4,
    },
    modalSection: {
      marginTop: Spacing.lg,
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    modalBio: {
      fontSize: 15,
      color: colors.text,
      lineHeight: 22,
    },
    modalActionBox: {
      marginTop: Spacing.xl,
    },
    modalConnectedBox: {
      backgroundColor: colors.surface,
      padding: Spacing.md,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderLight,
      alignItems: 'center',
    },
    connectedLabel: {
      fontSize: 12,
      color: '#22c55e',
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    connectedHandle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginVertical: 4,
    },
    modalTelegramBtnWrapper: {
      borderRadius: 12,
      overflow: 'hidden',
      marginTop: 10,
      width: '100%',
    },
    modalTelegramGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
    },
    modalTelegramBtnText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '700',
    },
    modalPendingBox: {
      backgroundColor: colors.surface,
      padding: Spacing.md,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderLight,
      alignItems: 'center',
    },
    modalPendingTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: '#eab308',
    },
    modalPendingSub: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 4,
    },
    modalRecallBtnWrapper: {
      borderRadius: 10,
      overflow: 'hidden',
      marginTop: 14,
      width: '100%',
    },
    modalRecallGradient: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 10,
      width: '100%',
    },
    modalRecallBtnText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '700',
    },
    approvedActionRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    shareIconButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: 'rgba(124, 58, 237, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
      borderWidth: 1,
      borderColor: 'rgba(124, 58, 237, 0.2)',
    },
    itemHandleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
      marginBottom: 4,
    },
    itemHandleLabel: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: '600',
    },
    itemHandleText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '700',
    },
  });

