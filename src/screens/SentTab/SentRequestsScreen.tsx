import React, { useCallback, useContext, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import LinearGradient from 'react-native-linear-gradient';
import { useConnection, ConnectionRequest } from '../../api/useConnection';
import AppContext from '../../context/CreateGlobalStateContext';
import { Colors, useTheme } from '../../theme';
import apiClient from '../../api/apiClient';
import NotificationBanner from '../../components/NotificationBanner';
import { openTelegramChat } from '../../utils/telegramHelper';
import { t, useTranslation } from '../../i18n';

const girl1 = require('../../assets/MessageTabImages/girl1.webp');
const girl2 = require('../../assets/MessageTabImages/girl2.webp');
const girl3 = require('../../assets/MessageTabImages/girl3.webp');
const envelopeImg = require('../../assets/MessageTabImages/envelope.png');

const SentRequestsScreen: React.FC = () => {
  useTranslation();
  const { themeColors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const {
    setViewMyProfile,
    setCardUserName,
    setCardUserAge,
    setSelectedUserImage,
    setPaywallVisible,
  } = useContext(AppContext);

  const { sentList, refreshAll } = useConnection();
  const { data: requests = [], isLoading, isRefetching } = sentList;

  // Auto-refetch when user focuses this screen
  useFocusEffect(
    useCallback(() => {
      refreshAll();
    }, [])
  );

  const [activeTab, setActiveTab] = useState<'pending' | 'accepted'>('accepted');
  const [searchQuery, setSearchQuery] = useState('');
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const isAcceptedStatus = (status?: string) => {
    const s = String(status || '').trim().toUpperCase();
    return s === 'ACCEPTED' || s === 'APPROVED';
  };

  // Group requests into pending vs accepted
  const pendingRequests = useMemo(
    () =>
      requests.filter(
        (r) =>
          !isAcceptedStatus(r.status) &&
          r.status !== 'CANCELLED' &&
          r.status !== 'DECLINED' &&
          r.status !== 'REJECTED'
      ),
    [requests]
  );

  const acceptedRequests = useMemo(
    () => requests.filter((r) => isAcceptedStatus(r.status)),
    [requests]
  );

  const currentList = activeTab === 'pending' ? pendingRequests : acceptedRequests;

  const filteredRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentList;
    return currentList.filter((r) => {
      const receiver = r.receiver || {};
      const name = (receiver.displayName || receiver.name || '').toLowerCase();
      return name.includes(q);
    });
  }, [currentList, searchQuery]);

  const cleanDisplayName = (name?: string) => {
    if (!name) return t('home.usercard.user');
    return String(name).replace(/,\s*\d+$/, '').trim() || t('home.usercard.user');
  };

  const formatRelativeTime = (isoString?: string | null) => {
    if (!isoString) return '1 year ago';
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '1 year ago';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays >= 365) return t('sent.sentrequestsscreen.year_ago', { Math: Math.floor(diffDays / 365) });
    if (diffDays >= 30) return t('sent.sentrequestsscreen.months_ago', { Math: Math.floor(diffDays / 30) });
    if (diffDays > 0) return t('sent.sentrequestsscreen.days_ago', { diffDays });
    if (diffHours > 0) return t('sent.sentrequestsscreen.hours_ago', { diffHours });
    return 'Just now';
  };

  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  const handleRestoreAccess = async (item: ConnectionRequest) => {
    const receiver = item.receiver || {};
    const name = cleanDisplayName(receiver.displayName || receiver.name);

    Alert.alert(
      'Restore Access',
      t('sent.sentrequestsscreen.would_you_like_to_restore_active_access_to_chat_with', { name }),
      [
        { text: t('profile.additionaluploadsection.cancel'), style: 'cancel' },
        {
          text: t('sent.sentrequestsscreen.restore_now'),
          onPress: async () => {
            try {
              setRestoringId(String(item.id));
              await apiClient.post('/connections/restore-access', { requestId: item.id });
              Alert.alert('Access Restored', t('sent.sentrequestsscreen.you_can_now_connect_with', { name }));
              refreshAll();
            } catch {
              // Open paywall if subscription needed
              setPaywallVisible?.(true);
            } finally {
              setRestoringId(null);
            }
          },
        },
      ]
    );
  };

  const handleOpenProfile = (item: ConnectionRequest) => {
    const receiver = item.receiver || {};
    const targetUserId = receiver.id || receiver.userId || (item as any).receiverId;
    const photoUrl =
      receiver.photo ||
      (receiver.photos && receiver.photos[0]) ||
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800';

    setCardUserName?.(cleanDisplayName(receiver.displayName || receiver.name));
    setCardUserAge?.(String(receiver.age || '25'));
    setViewMyProfile?.(false);
    setSelectedUserImage?.(photoUrl);

    navigation.navigate('ViewMyProfileScreen', {
      userId: targetUserId,
      targetUserId: targetUserId,
      profileData: {
        ...receiver,
        id: targetUserId,
        displayName: cleanDisplayName(receiver.displayName || receiver.name),
        photos: receiver.photos || [photoUrl],
      },
      image: photoUrl,
    });
  };

  const renderCard = ({ item }: { item: ConnectionRequest }) => {
    const receiver = item.receiver || {};
    const photoUrl =
      receiver.photo ||
      (receiver.photos && receiver.photos[0]) ||
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800';

    const displayName = cleanDisplayName(receiver.displayName || receiver.name);
    const age = receiver.age ? `, ${receiver.age}` : '';
    const timeText = formatRelativeTime(item.createdAt);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => handleOpenProfile(item)}
      >
        <Image source={{ uri: photoUrl }} style={styles.avatar} />

        <View style={styles.cardInfo}>
          <Text style={styles.nameAgeText} numberOfLines={1}>
            {displayName}{age}
          </Text>

          {activeTab === 'accepted' ? (
            item.accessExpired ? (
              <TouchableOpacity
                style={styles.restoreBtnWrapper}
                activeOpacity={0.8}
                onPress={() => handleRestoreAccess(item)}
                disabled={restoringId === String(item.id)}
              >
                <LinearGradient
                  colors={[themeColors.primary, themeColors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.restoreBtn}
                >
                  {restoringId === String(item.id) ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <View style={styles.restoreBtnContent}>
                      <Icon name="lock" size={13} color="#FFFFFF" style={styles.lockIcon} />
                      <Text style={styles.restoreBtnText}>{t('sent.sentrequestsscreen.restore_access')}</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.chatBtn}
                activeOpacity={0.8}
                onPress={() => openTelegramChat(receiver.telegramUsername)}
              >
                <Icon name="send" size={13} color="#FFFFFF" style={{ marginRight: 5 }} />
                <Text style={styles.chatBtnText}>{t('requests.requestsinboxscreen.chat')}</Text>
              </TouchableOpacity>
            )
          ) : (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{t('sent.sentrequestsscreen.pending_reply')}</Text>
            </View>
          )}
        </View>

        <Text style={styles.timestampText}>{timeText}</Text>
      </TouchableOpacity>
    );
  };

  const hasAnyInvitations = requests.length > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Notification Banner */}
      <NotificationBanner />

      {/* Top Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>{t('messages.messagescreen.invitations')}</Text>
        {hasAnyInvitations && (
          <View style={styles.headerActions}>
            <TouchableOpacity activeOpacity={0.7} style={styles.selectBtn}>
              <Text style={styles.selectText}>{t('requests.requestsinboxscreen.select')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.refreshBtn}
              onPress={refreshAll}
            >
              <Icon name="sync" size={20} color={themeColors.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* When user has no invitations at all, show empty illustration */}
      {!isLoading && !hasAnyInvitations ? (
        <View style={styles.emptyContainer}>
          {/* 3 Overlapping Avatars (pyramid) */}
          <View style={styles.avatarPyramid}>
            <Image source={girl1} style={[styles.pyramidAvatar, styles.avatarTopLeft]} />
            <Image source={girl2} style={[styles.pyramidAvatar, styles.avatarTopRight]} />
            <View style={styles.avatarBottomCenterWrapper}>
              <Image source={girl3} style={[styles.pyramidAvatar, styles.avatarBottomCenter]} />
              <View style={styles.envelopeBadge}>
                <Image source={envelopeImg} style={styles.envelopeIcon} resizeMode="contain" />
              </View>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.emptyInvitesTitle}>
            {t('sent.sentrequestsscreen.you_havent_invited_anyone_yet')}
          </Text>

          {/* Subtitle */}
          <Text style={styles.emptyInvitesSubtitle}>{t('sent.sentrequestsscreen.when_she_accepts_your_invitation_you_can_contact_her_on_whatsapp_or_te')}</Text>

          {/* Invite now pill button */}
          <TouchableOpacity
            style={styles.inviteNowBtnWrapper}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Home')}
          >
            <LinearGradient
              colors={[themeColors.primary, themeColors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.inviteNowBtn}
            >
              <Text style={styles.inviteNowText}>{t('messages.invitebutton.invite_now')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Segmented Control Pills */}
          <View style={styles.segmentedWrap}>
            <TouchableOpacity
              style={styles.segmentPillWrapper}
              onPress={() => setActiveTab('pending')}
              activeOpacity={0.7}
            >
              {activeTab === 'pending' ? (
                <LinearGradient
                  colors={[themeColors.primary, themeColors.primaryLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.segmentPillActive}
                >
                  <Text style={styles.segmentTextActive}>{t('requests.requestsinboxscreen.pending')}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.segmentPillInactive}>
                  <Text style={styles.segmentTextInactive}>{t('requests.requestsinboxscreen.pending')}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.segmentPillWrapper}
              onPress={() => setActiveTab('accepted')}
              activeOpacity={0.7}
            >
              {activeTab === 'accepted' ? (
                <LinearGradient
                  colors={[themeColors.primary, themeColors.primaryLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.segmentPillActive}
                >
                  <Text style={styles.segmentTextActive}>{t('requests.requestsinboxscreen.accepted')}</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>
                      {acceptedRequests.length > 9 ? '9+' : acceptedRequests.length || '9+'}
                    </Text>
                  </View>
                </LinearGradient>
              ) : (
                <View style={styles.segmentPillInactive}>
                  <Text style={styles.segmentTextInactive}>{t('requests.requestsinboxscreen.accepted')}</Text>
                  <View style={styles.countBadgeInactive}>
                    <Text style={styles.countBadgeInactiveText}>
                      {acceptedRequests.length > 9 ? '9+' : acceptedRequests.length || '9+'}
                    </Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Search Bar: "Search by name" */}
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

          {/* List */}
          {isLoading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={themeColors.primary} />
            </View>
          ) : filteredRequests.length === 0 ? (
            <View style={styles.centerBox}>
              <Icon name="email-outline" size={48} color={themeColors.textMuted} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>
                {t('sent.sentrequestsscreen.no_invitations', { activeTab })}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'accepted'
                  ? t('sent.sentrequestsscreen.invitations_that_are_accepted_will_appear_here')
                  : t('sent.sentrequestsscreen.you_have_no_invitations_waiting_for_a_reply')}
              </Text>
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
            />
          )}
        </>
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
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 8,
    },
    headerTitle: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
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
    refreshBtn: {
      padding: 4,
    },
    segmentedWrap: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      marginTop: 12,
      marginBottom: 16,
      gap: 12,
    },
    segmentPillWrapper: {
      borderRadius: 22,
      overflow: 'hidden',
    },
    segmentPillActive: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 22,
    },
    segmentPillInactive: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 9,
      paddingHorizontal: 19,
      borderRadius: 22,
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.border,
    },
    segmentText: {
      fontSize: 15,
      fontWeight: '600',
    },
    segmentTextActive: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
    },
    segmentTextInactive: {
      color: colors.textSecondary,
      fontSize: 15,
      fontWeight: '500',
    },
    countBadge: {
      marginLeft: 6,
      backgroundColor: colors.secondary,
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 1,
    },
    countBadgeText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
    countBadgeInactive: {
      marginLeft: 6,
      backgroundColor: colors.surfaceLighter || colors.surface,
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 1,
    },
    countBadgeInactiveText: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '700',
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
      gap: 14,
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
      marginLeft: 14,
      justifyContent: 'center',
    },
    nameAgeText: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '700',
      marginBottom: 6,
    },
    restoreBtnWrapper: {
      alignSelf: 'flex-start',
      borderRadius: 16,
      overflow: 'hidden',
    },
    restoreBtn: {
      borderRadius: 16,
      paddingVertical: 6,
      paddingHorizontal: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    restoreBtnContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    lockIcon: {
      marginRight: 5,
    },
    restoreBtnText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },
    chatBtn: {
      alignSelf: 'flex-start',
      backgroundColor: '#0088cc',
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 14,
    },
    chatBtnText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },
    pendingBadge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.surfaceLight,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 4,
      paddingHorizontal: 10,
    },
    pendingBadgeText: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '500',
    },
    timestampText: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '400',
      alignSelf: 'flex-start',
      marginTop: 2,
    },
    centerBox: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 6,
    },
    emptySubtitle: {
      color: colors.textSecondary,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingBottom: 40,
    },
    avatarPyramid: {
      width: 170,
      height: 120,
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    pyramidAvatar: {
      borderRadius: 999,
    },
    avatarTopLeft: {
      position: 'absolute',
      top: 0,
      left: 14,
      width: 66,
      height: 66,
      borderRadius: 33,
    },
    avatarTopRight: {
      position: 'absolute',
      top: 0,
      right: 14,
      width: 66,
      height: 66,
      borderRadius: 33,
    },
    avatarBottomCenterWrapper: {
      position: 'absolute',
      bottom: 0,
      width: 76,
      height: 76,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarBottomCenter: {
      width: 76,
      height: 76,
      borderRadius: 38,
      borderWidth: 3,
      borderColor: colors.background,
    },
    envelopeBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderLight,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 3,
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowRadius: 3,
    },
    envelopeIcon: {
      width: 14,
      height: 14,
    },
    emptyInvitesTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
      lineHeight: 24,
      marginTop: 18,
    },
    emptyInvitesSubtitle: {
      color: colors.textSecondary,
      fontSize: 13,
      textAlign: 'center',
      lineHeight: 20,
      marginTop: 12,
      marginHorizontal: 16,
    },
    inviteNowBtnWrapper: {
      borderRadius: 24,
      overflow: 'hidden',
      marginTop: 26,
    },
    inviteNowBtn: {
      paddingHorizontal: 36,
      paddingVertical: 12,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    inviteNowText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
    },
  });
