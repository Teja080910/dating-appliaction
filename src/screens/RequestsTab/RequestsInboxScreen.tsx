import React, { useContext, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Modal,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import LinearGradient from 'react-native-linear-gradient';
import { useConnection, ConnectionRequest } from '../../api/useConnection';
import AppContext from '../../context/CreateGlobalStateContext';
import { Colors, useTheme } from '../../theme';
import { getUserFriendlyMessage } from '../../utils/userFriendlyMessages';
import { openTelegramChat } from '../../utils/telegramHelper';
import { t, useTranslation } from '../../i18n';

const RequestsInboxScreen: React.FC = () => {
  useTranslation();
  const { themeColors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const { setViewMyProfile, setCardUserName, setCardUserAge, setSelectedUserImage } =
    useContext(AppContext);
  const { receivedList, accept, refreshAll } = useConnection();

  // Tabs: 'accepted' on left, 'pending' on right (Screenshot 4B & 4C)
  const [activeTab, setActiveTab] = useState<'accepted' | 'pending'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [approvedMatch, setApprovedMatch] = useState<{
    name: string;
    photo: string;
    username?: string;
  } | null>(null);

  const { data: requests = [], isLoading, isRefetching } = receivedList;

  // Split into accepted vs pending
  const acceptedRequests = useMemo(
    () => requests.filter((r) => r.status === 'APPROVED'),
    [requests]
  );

  const pendingRequests = useMemo(
    () => requests.filter((r) => r.status !== 'APPROVED'),
    [requests]
  );

  const currentList = activeTab === 'accepted' ? acceptedRequests : pendingRequests;

  const filteredRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentList;
    return currentList.filter((r) => {
      const sender = r.sender || {};
      const name = (sender.displayName || sender.name || '').toLowerCase();
      return name.includes(q);
    });
  }, [currentList, searchQuery]);

  const cleanDisplayName = (name?: string) => {
    if (!name) return t('home.usercard.user');
    return String(name).replace(/,\s*\d+$/, '').trim() || t('home.usercard.user');
  };

  const formatStatusDate = (item: ConnectionRequest) => {
    if (item.status === 'REJECTED') {
      const date = item.updatedAt ? new Date(item.updatedAt) : new Date();
      const formatted = date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      return t('requests.requestsinboxscreen.rejected', { formatted });
    }

    const date = item.createdAt ? new Date(item.createdAt) : new Date();
    const formatted = date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return t('requests.requestsinboxscreen.invited', { formatted });
  };

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
        name: sender.displayName || sender.name || t('requests.requestsinboxscreen.dating_match'),
        photo: photoUrl,
        username: approvedRequest?.sender?.telegramUsername || sender.telegramUsername,
      });
    } catch (err: any) {
      Alert.alert(
        'Could not approve invitation',
        getUserFriendlyMessage(err, t('profile.userdetails.please_try_again_in_a_moment'))
      );
    }
  };

  const handleOpenProfile = (item: ConnectionRequest) => {
    const sender = item.sender || {};
    const targetUserId = sender.id || sender.userId || (item as any).senderId;
    const photoUrl =
      sender.photo ||
      (sender.photos && sender.photos[0]) ||
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800';

    setCardUserName?.(cleanDisplayName(sender.displayName || sender.name));
    setCardUserAge?.(String(sender.age || '26'));
    setViewMyProfile?.(false);
    setSelectedUserImage?.(photoUrl);

    navigation.navigate('ViewMyProfileScreen', {
      userId: targetUserId,
      targetUserId: targetUserId,
      profileData: {
        ...sender,
        id: targetUserId,
        displayName: cleanDisplayName(sender.displayName || sender.name),
        photos: sender.photos || [photoUrl],
      },
      image: photoUrl,
      requestId: item.id,
      requestRole: 'received',
      requestStatus: item.status,
    });
  };

  const handleOpenTelegram = (username?: string) => {
    openTelegramChat(username);
  };

  const renderCard = ({ item }: { item: ConnectionRequest }) => {
    const sender = item.sender || {};
    const photoUrl =
      sender.photo ||
      (sender.photos && sender.photos[0]) ||
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800';

    const displayName = cleanDisplayName(sender.displayName || sender.name);
    const statusText = formatStatusDate(item);
    const isApproved = item.status === 'APPROVED';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => handleOpenProfile(item)}
      >
        <Image source={{ uri: photoUrl }} style={styles.avatar} />

        <View style={styles.cardInfo}>
          <Text style={styles.nameText} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.statusSubtext}>{statusText}</Text>
        </View>

        {!isApproved && (
          <TouchableOpacity
            style={styles.approveBtnWrapper}
            onPress={() => handleApprove(item)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[themeColors.primary, themeColors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.approveBtn}
            >
              <Text style={styles.approveBtnText}>{t('messages.messagescreen.accept')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {isApproved && (
          <TouchableOpacity
            style={styles.telegramBtn}
            onPress={() => handleOpenTelegram(sender.telegramUsername)}
            activeOpacity={0.8}
          >
            <Icon name="send" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.telegramBtnText}>{t('requests.requestsinboxscreen.chat')}</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Brand Header */}
      <View style={styles.headerRow}>
        <Text style={styles.brandTitle}>{t('home.homeheader.amara')}</Text>
        <TouchableOpacity activeOpacity={0.7} style={styles.selectBtn}>
          <Text style={styles.selectText}>{t('requests.requestsinboxscreen.select')}</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs: Accepted | Pending */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'accepted' && styles.tabButtonActive]}
          onPress={() => setActiveTab('accepted')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'accepted' ? styles.tabTextActive : styles.tabTextInactive,
            ]}
          >{t('requests.requestsinboxscreen.accepted')}</Text>
          {activeTab === 'accepted' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'pending' && styles.tabButtonActive]}
          onPress={() => setActiveTab('pending')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'pending' ? styles.tabTextActive : styles.tabTextInactive,
            ]}
          >
            Pending
          </Text>
          {activeTab === 'pending' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <Icon name="magnify" size={20} color={themeColors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('requests.requestsinboxscreen.search_by_name')}
          placeholderTextColor={themeColors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close-circle" size={18} color={themeColors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Main Content Area */}
      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      ) : activeTab === 'accepted' && filteredRequests.length === 0 ? (
        // Empty Accepted State with Envelope Illustration
        <View style={styles.emptyAcceptedBox}>
          <View style={styles.envelopeIconWrap}>
            <Icon name="email-open-outline" size={72} color={themeColors.primary} />
          </View>
          <Text style={styles.emptyAcceptedTitle}>{t('requests.requestsinboxscreen.you_have_no_accepted_invitations_yet')}</Text>
          <Text style={styles.emptyAcceptedSubtitle}>{t('requests.requestsinboxscreen.you_will_receive_new_invitations_soon')}</Text>
        </View>
      ) : filteredRequests.length === 0 ? (
        <View style={styles.centerBox}>
          <Icon name="email-outline" size={48} color={themeColors.textMuted} style={{ marginBottom: 12 }} />
          <Text style={styles.emptyPendingTitle}>{t('requests.requestsinboxscreen.no_invitations_found')}</Text>
          <Text style={styles.emptyPendingSubtitle}>{t('requests.requestsinboxscreen.when_men_invite_you_they_will_appear_right_here')}</Text>
        </View>
      ) : (
        <FlatList
          style={styles.list}
          data={filteredRequests}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderCard}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 110 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refreshAll}
              tintColor={themeColors.primary}
            />
          }
          ListFooterComponent={
            <View style={styles.bottomFooterNotice}>
              <Text style={styles.bottomNoticeText}>{t('requests.requestsinboxscreen.you_only_see_men_who_invite_you_at_amara_men_approach_you_first_just_l')}</Text>
            </View>
          }
        />
      )}

      {/* Approval Success Modal */}
      <Modal
        visible={Boolean(approvedMatch)}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setApprovedMatch(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Image source={{ uri: approvedMatch?.photo }} style={styles.modalAvatar} />
            <Text style={styles.modalTitle}>{t('requests.requestsinboxscreen.request_accepted')}</Text>
            <Text style={styles.modalSubtitle}>{t('requests.requestsinboxscreen.you_are_now_connected_with')}{' '}
              <Text style={{ fontWeight: '700', color: themeColors.text }}>{approvedMatch?.name}</Text>.
            </Text>
            <TouchableOpacity
              style={styles.modalTelegramBtnWrapper}
              onPress={() => {
                const u = approvedMatch?.username;
                setApprovedMatch(null);
                handleOpenTelegram(u);
              }}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[themeColors.primary, themeColors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalTelegramBtn}
              >
                <Text style={styles.modalTelegramBtnText}>{t('profile.userdetails.open_telegram')}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setApprovedMatch(null)}
            >
              <Text style={styles.modalDoneBtnText}>{t('profile.userdetails.done')}</Text>
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
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 8,
    },
    brandTitle: {
      color: colors.primary,
      fontSize: 26,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    selectBtn: {
      paddingVertical: 4,
      paddingHorizontal: 6,
    },
    selectText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '600',
    },
    tabsRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginHorizontal: 16,
      marginBottom: 16,
    },
    tabButton: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
      position: 'relative',
    },
    tabButtonActive: {},
    tabButtonText: {
      fontSize: 16,
      fontWeight: '700',
    },
    tabTextActive: {
      color: colors.primary,
    },
    tabTextInactive: {
      color: colors.textSecondary,
    },
    tabIndicator: {
      position: 'absolute',
      bottom: -1,
      left: 20,
      right: 20,
      height: 3,
      backgroundColor: colors.primary,
      borderRadius: 2,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.borderLight,
      marginHorizontal: 20,
      paddingHorizontal: 16,
      height: 44,
      marginBottom: 16,
    },
    searchIcon: {
      marginRight: 10,
    },
    searchInput: {
      flex: 1,
      color: colors.text,
      fontSize: 15,
      paddingVertical: 0,
    },
    list: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: 20,
      gap: 16,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
    },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.surfaceLight,
    },
    cardInfo: {
      flex: 1,
      marginLeft: 16,
      justifyContent: 'center',
    },
    nameText: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 4,
    },
    statusSubtext: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '500',
    },
    approveBtnWrapper: {
      borderRadius: 18,
      overflow: 'hidden',
    },
    approveBtn: {
      borderRadius: 18,
      paddingVertical: 8,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    approveBtnText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
    telegramBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#0088cc',
      borderRadius: 18,
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    telegramBtnText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    emptyAcceptedBox: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      marginBottom: 40,
    },
    envelopeIconWrap: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    emptyAcceptedTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 8,
    },
    emptyAcceptedSubtitle: {
      color: colors.textSecondary,
      fontSize: 15,
      textAlign: 'center',
      lineHeight: 22,
    },
    centerBox: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    emptyPendingTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 6,
    },
    emptyPendingSubtitle: {
      color: colors.textSecondary,
      fontSize: 14,
      textAlign: 'center',
    },
    bottomFooterNotice: {
      paddingHorizontal: 24,
      paddingTop: 12,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    bottomNoticeText: {
      color: colors.textMuted,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    modalCard: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      padding: 24,
      alignItems: 'center',
    },
    modalAvatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      marginBottom: 16,
    },
    modalTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 8,
    },
    modalSubtitle: {
      color: colors.textSecondary,
      fontSize: 15,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 20,
    },
    modalTelegramBtnWrapper: {
      width: '100%',
      borderRadius: 24,
      overflow: 'hidden',
      marginBottom: 10,
    },
    modalTelegramBtn: {
      width: '100%',
      borderRadius: 24,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalTelegramBtnText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },
    modalDoneBtn: {
      paddingVertical: 10,
    },
    modalDoneBtnText: {
      color: colors.textSecondary,
      fontSize: 15,
    },
  });
