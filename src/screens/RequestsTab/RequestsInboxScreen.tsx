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
  Modal,
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
import { getUserFriendlyMessage } from '../../utils/userFriendlyMessages';

const RequestsInboxScreen: React.FC = () => {
  const { themeColors, isDark } = useTheme();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { setViewMyProfile, setCardUserName, setCardUserAge, setSelectedUserImage } =
    useContext(AppContext);
  const { receivedList, accept, refreshAll } = useConnection();
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [approvedMatch, setApprovedMatch] = useState<{
    name: string;
    photo: string;
    username?: string;
  } | null>(null);


  const { data: requests = [], isLoading, isRefetching } = receivedList;

  const sortedRequests = [...requests].sort((a, b) => {
    const aTime = new Date(a.createdAt || a.updatedAt || 0).getTime();
    const bTime = new Date(b.createdAt || b.updatedAt || 0).getTime();
    return bTime - aTime;
  });
  const pendingRequests = sortedRequests.filter((r) => r.status !== 'APPROVED');
  const approvedRequests = sortedRequests.filter((r) => r.status === 'APPROVED');
  const tabFilteredRequests =
    activeTab === 'pending'
      ? pendingRequests
      : activeTab === 'approved'
      ? approvedRequests
      : sortedRequests;

  const formatRequestTime = (value?: string | null) => {
    if (!value) return 'Time unavailable';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Time unavailable';
    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  };

  const displayedRequests = searchQuery.trim()
    ? tabFilteredRequests.filter((r) => {
        const sender = r.sender || {};
        const q = searchQuery.toLowerCase().trim();
        const name = (sender.displayName || sender.name || '').toLowerCase();
        const city = (sender.city || sender.currentCity || '').toLowerCase();
        return name.includes(q) || city.includes(q);
      })
    : tabFilteredRequests;

  const handleApprove = async (request: ConnectionRequest) => {
    try {
      const approvalResponse = await accept.mutateAsync(request.id);
      const approvedRequest = approvalResponse?.data || approvalResponse;
      const sender = request.sender || {};
      const photoUrl =
        sender.photo ||
        (sender.photos && sender.photos[0]) ||
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800';

      setApprovedMatch({
        name: sender.displayName || sender.name || 'Dating Match',
        photo: photoUrl,
        username: approvedRequest?.sender?.telegramUsername || sender.telegramUsername,
      });
    } catch (err: any) {
      Alert.alert('Could not approve invitation', getUserFriendlyMessage(err, 'Please try again in a moment.'));
    }
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

  const cleanDisplayName = (name?: string) => {
    if (!name) return 'User';
    return String(name).replace(/,\s*\d+$/, '').trim() || 'User';
  };

  const handleOpenProfile = (item: ConnectionRequest) => {
    const sender = item.sender || {};
    const targetUserId = sender.id || sender.userId || (item as any).senderId;
    const photoUrl =
      sender.photo ||
      (sender.photos && sender.photos[0]) ||
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800';

    const fullProfileData = {
      ...sender,
      id: targetUserId,
      userId: targetUserId,
      targetUserId: targetUserId,
      name: cleanDisplayName(sender.displayName || sender.name),
      displayName: cleanDisplayName(sender.displayName || sender.name),
      age: sender.age,
      gender: sender.gender || 'man',
      bio: sender.bio || '',
      currentCity: sender.city || sender.currentCity || 'Nearby',
      photos: sender.photos || (photoUrl ? [photoUrl] : []),
      images: sender.photos || (photoUrl ? [photoUrl] : []),
      profileImageUrl: photoUrl,
      image: photoUrl,
      telegramUsername: sender.telegramUsername || '',
      smoke: sender.smoke,
      drink: sender.drink,
      height: sender.height,
      bodyType: sender.bodyType,
      appearance: sender.appearance,
      language: sender.language,
      englishLevel: sender.englishLevel,
      ethnicity: sender.ethnicity,
      lookingFor: sender.lookingFor,
    };

    setCardUserName(fullProfileData.name);
    setCardUserAge(String(fullProfileData.age || '26'));
    setViewMyProfile(false);
    setSelectedUserImage(photoUrl);

    navigation.navigate('ViewMyProfileScreen', {
      userId: targetUserId,
      targetUserId: targetUserId,
      profileData: fullProfileData,
      image: photoUrl,
      requestId: item.id,
      requestRole: 'received',
      requestStatus: item.status,
    });
  };

  const renderItem = ({ item }: { item: ConnectionRequest }) => {
    const sender = item.sender || {};
    const photoUrl =
      sender.photo ||
      (sender.photos && sender.photos[0]) ||
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800';
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
              {cleanDisplayName(sender.displayName || sender.name)}
              {sender.age ? `, ${sender.age}` : ''}
            </Text>

            {!isApproved ? (
              <TouchableOpacity
                style={styles.smallActionWrapper}
                activeOpacity={0.8}
                onPress={() => handleApprove(item)}
                disabled={accept.isPending}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.smallActionGradient}
                >
                  {accept.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.smallActionText}>Approve</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View style={styles.approvedActionRow}>
                <TouchableOpacity
                  style={styles.smallActionWrapper}
                  activeOpacity={0.8}
                  onPress={() => handleOpenTelegram(sender.telegramUsername)}
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
                {sender.telegramUsername ? (
                  <TouchableOpacity
                    style={styles.shareIconButton}
                    activeOpacity={0.7}
                    onPress={() => handleShareTelegram(sender.telegramUsername)}
                    accessibilityLabel="Share Telegram Handle"
                  >
                    <Icon name="share-variant-outline" size={17} color={Colors.primary} />
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
          </View>

          {isApproved && sender.telegramUsername ? (
            <View style={styles.itemHandleRow}>
              <Text style={styles.itemHandleLabel}>Telegram: </Text>
              <Text selectable={true} style={styles.itemHandleText}>
                @{sender.telegramUsername.replace('@', '')}
              </Text>
            </View>
          ) : null}

          {sender.city ? (
            <Text style={styles.cityText} numberOfLines={1}>
              {sender.city}
            </Text>
          ) : null}

          {sender.bio ? (
            <Text style={styles.bioText} numberOfLines={1}>
              {sender.bio}
            </Text>
          ) : null}
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{formatRequestTime(item.createdAt)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Dating Requests</Text>
        <Text style={styles.screenSubtitle}>
          {pendingRequests.length} pending request{pendingRequests.length === 1 ? '' : 's'}
        </Text>
      </View>

      {/* Clean Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItemWrapper}
          activeOpacity={0.8}
          onPress={() => setActiveTab('pending')}
        >
          {activeTab === 'pending' ? (
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tabItemGradient}
            >
              <Text style={styles.tabTextActive}>
                Pending ({pendingRequests.length})
              </Text>
            </LinearGradient>
          ) : (
            <View style={styles.tabItemInactive}>
              <Text style={styles.tabTextInactive}>
                Pending ({pendingRequests.length})
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItemWrapper}
          activeOpacity={0.8}
          onPress={() => setActiveTab('approved')}
        >
          {activeTab === 'approved' ? (
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tabItemGradient}
            >
              <Text style={styles.tabTextActive}>
                Approved ({approvedRequests.length})
              </Text>
            </LinearGradient>
          ) : (
            <View style={styles.tabItemInactive}>
              <Text style={styles.tabTextInactive}>
                Approved ({approvedRequests.length})
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItemWrapper}
          activeOpacity={0.8}
          onPress={() => setActiveTab('all')}
        >
          {activeTab === 'all' ? (
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tabItemGradient}
            >
              <Text style={styles.tabTextActive}>
                All ({requests.length})
              </Text>
            </LinearGradient>
          ) : (
            <View style={styles.tabItemInactive}>
              <Text style={styles.tabTextInactive}>
                All ({requests.length})
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color={Colors.textMuted} />
        <TextInput
          placeholder="Search requests by name or city..."
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

      {/* List / Empty State */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      ) : displayedRequests.length === 0 ? (
        <View style={styles.centerContainer}>
          <Icon
            name={
              searchQuery.trim()
                ? 'account-search-outline'
                : activeTab === 'approved'
                ? 'check-circle-outline'
                : 'email-outline'
            }
            size={48}
            color={Colors.textMuted}
            style={{ marginBottom: Spacing.md }}
          />
          <Text style={styles.emptyTitle}>
            {searchQuery.trim()
              ? 'No Results Found'
              : activeTab === 'approved'
              ? 'No Approved Requests'
              : 'No Pending Requests'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery.trim()
              ? `No ${activeTab} requests match "${searchQuery.trim()}".`
              : activeTab === 'approved'
              ? 'Approved requests will appear here with Telegram contacts.'
              : 'New dating requests from men will appear here.'}
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

      {/* Simple, Clean Approval Popup */}
      <Modal
        visible={Boolean(approvedMatch)}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setApprovedMatch(null)}
      >
        <View style={styles.simpleModalOverlay}>
          <View style={styles.simpleModalCard}>
            <Image
              source={{ uri: approvedMatch?.photo }}
              style={styles.simpleModalAvatar}
            />

            <Text style={styles.simpleModalTitle}>Request Approved</Text>
            <Text style={styles.simpleModalSubtitle}>
              You are now connected with{' '}
              <Text style={{ fontWeight: '700', color: Colors.text }}>{approvedMatch?.name}</Text>.
            </Text>

            <View style={styles.simpleTelegramRow}>
              <Text selectable={true} style={styles.simpleTelegramHandle}>
                {approvedMatch?.username
                  ? `@${approvedMatch.username.replace('@', '')}`
                  : 'Telegram not connected'}
              </Text>
              {approvedMatch?.username ? (
                <TouchableOpacity
                  style={styles.modalShareBtn}
                  activeOpacity={0.7}
                  onPress={() => handleShareTelegram(approvedMatch.username)}
                >
                  <Icon name="share-variant-outline" size={15} color={Colors.primary} />
                  <Text style={styles.modalShareText}>Share</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <TouchableOpacity
              style={styles.simplePrimaryBtnWrapper}
              activeOpacity={0.8}
              onPress={() => {
                const username = approvedMatch?.username;
                setApprovedMatch(null);
                handleOpenTelegram(username);
              }}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.simplePrimaryGradient}
              >
                <Text style={styles.simplePrimaryBtnText}>Open Telegram</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.simpleSecondaryBtn}
              onPress={() => setApprovedMatch(null)}
            >
              <Text style={styles.simpleSecondaryBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default RequestsInboxScreen;

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
    tabBar: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
      gap: 8,
    },
    tabItemWrapper: {
      borderRadius: 20,
      overflow: 'hidden',
    },
    tabItemGradient: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tabItemInactive: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tabTextActive: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 13,
    },
    tabTextInactive: {
      color: colors.textMuted,
      fontWeight: '600',
      fontSize: 13,
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
    approvedPill: {
      backgroundColor: 'rgba(34, 197, 94, 0.15)',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    approvedPillText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#22c55e',
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
    metaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 6,
    },
    metaText: {
      fontSize: 11,
      color: colors.textMuted,
    },
    statusText: {
      fontSize: 10,
      fontWeight: '800',
    },
    approvedStatus: {
      color: '#22c55e',
    },
    pendingStatus: {
      color: colors.secondary,
    },
    actionRow: {
      marginTop: 8,
      flexDirection: 'row',
    },
    approveButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 7,
      borderRadius: 8,
      alignSelf: 'flex-start',
    },
    approveButtonText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '700',
    },
    telegramPillButtonWrapper: {
      borderRadius: 14,
      overflow: 'hidden',
      alignSelf: 'flex-start',
    },
    telegramGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 14,
    },
    telegramPillButtonText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
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
    modalApproveBtn: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    modalApproveBtnText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
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
    // Simple Popup Styles
    simpleModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
    },
    simpleModalCard: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: Spacing.xl,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    simpleModalAvatar: {
      width: 76,
      height: 76,
      borderRadius: 38,
      marginBottom: Spacing.md,
    },
    simpleModalTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 4,
    },
    simpleModalSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: Spacing.lg,
    },
    simpleTelegramRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(124, 58, 237, 0.08)',
      paddingHorizontal: Spacing.md,
      paddingVertical: 10,
      borderRadius: 10,
      width: '100%',
      justifyContent: 'center',
      marginBottom: Spacing.lg,
    },
    simpleTelegramHandle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    modalShareBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(124, 58, 237, 0.12)',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      marginLeft: Spacing.sm,
    },
    modalShareText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
      marginLeft: 4,
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
    simplePrimaryBtnWrapper: {
      width: '100%',
      borderRadius: 10,
      overflow: 'hidden',
      marginBottom: Spacing.sm,
    },
    simplePrimaryGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      paddingVertical: 13,
      borderRadius: 10,
    },
    simplePrimaryBtnText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '700',
    },
    simpleSecondaryBtn: {
      paddingVertical: 8,
    },
    simpleSecondaryBtnText: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '600',
    },
  });

