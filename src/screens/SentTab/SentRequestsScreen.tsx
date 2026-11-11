import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
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
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useConnection, ConnectionRequest } from '../../api/useConnection';
import { useSubscription } from '../../api/useSubscription';
import AppContext from '../../context/CreateGlobalStateContext';
import { Colors, Spacing, useTheme } from '../../theme';
import apiClient, { getAbsoluteUrl } from '../../api/apiClient';
import { getUserFriendlyMessage } from '../../utils/userFriendlyMessages';
import NotificationBanner from '../../components/NotificationBanner';
import { openTelegramChat } from '../../utils/telegramHelper';
import { openWhatsAppChat } from '../../utils/whatsappHelper';
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
  const route = useRoute<any>();
  const {
    setViewMyProfile,
    setCardUserName,
    setCardUserAge,
    setSelectedUserImage,
    setPaywallVisible,
    isSubscribed,
    gender,
  } = useContext(AppContext);

  const [userGender, setUserGender] = useState<string>('');
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const [g1, g2] = await Promise.all([
        AsyncStorage.getItem('userGender'),
        AsyncStorage.getItem('selectedGender'),
      ]);
      if (isMounted) {
        setUserGender((g1 || g2 || gender || '').toLowerCase());
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [gender]);

  const rawUserGender = (userGender || gender || '').toLowerCase();
  const isUserWoman = rawUserGender.includes('woman') || rawUserGender.includes('female');

  const { sentList, refreshAll, cancel } = useConnection();
  const { data: requests = [], isLoading } = sentList;
  const [manualRefreshing, setManualRefreshing] = useState(false);

  const refreshAllRef = useRef(refreshAll);
  refreshAllRef.current = refreshAll;

  const handleManualRefresh = useCallback(async () => {
    setManualRefreshing(true);
    try {
      await refreshAllRef.current();
    } finally {
      setManualRefreshing(false);
    }
  }, []);

  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('@deleted_invitations');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setHiddenIds(new Set(parsed.map(String)));
          }
        }
      } catch {}
    })();
  }, []);

  const { subscriptionStatus } = useSubscription();
  const [localSubActive, setLocalSubActive] = useState<boolean | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      (async () => {
        try {
          const [storedSub, storedEnd] = await Promise.all([
            AsyncStorage.getItem('isSubscribed'),
            AsyncStorage.getItem('@subscription_endDate'),
          ]);
          const isNotExpired = !storedEnd || new Date(storedEnd).getTime() > Date.now();
          if (isMounted) {
            setLocalSubActive(storedSub === 'true' && isNotExpired);
          }
        } catch {}
      })();
      return () => {
        isMounted = false;
      };
    }, [])
  );

  const effectiveIsSubscribed = Boolean(
    isSubscribed ||
    subscriptionStatus?.active ||
    localSubActive
  );

  const [activeTab, setActiveTab] = useState<'pending' | 'accepted'>(
    route?.params?.initialTab || 'pending'
  );

  // Auto-refetch when user focuses this screen, and sync initialTab if passed
  useFocusEffect(
    useCallback(() => {
      if (route?.params?.initialTab) {
        setActiveTab(route.params.initialTab);
      }
      refreshAllRef.current();
    }, [route?.params?.initialTab])
  );

  // Real-time synchronization when connections update across the app
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('AMARA_CONNECTION_UPDATED', () => {
      refreshAllRef.current();
    });
    return () => sub.remove();
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const isAcceptedStatus = (status?: string) => {
    const s = String(status || '').trim().toUpperCase();
    return (
      s === 'ACCEPTED' ||
      s === 'APPROVED' ||
      s === 'MATCHED' ||
      s === 'CONNECTED' ||
      s === 'MUTUAL'
    );
  };

  // Group requests into pending vs accepted (excluding deleted items)
  const pendingRequests = useMemo(
    () =>
      requests.filter(
        (r) =>
          !hiddenIds.has(String(r.id)) &&
          !isAcceptedStatus(r.status) &&
          r.status !== 'CANCELLED' &&
          r.status !== 'DECLINED' &&
          r.status !== 'REJECTED'
      ),
    [requests, hiddenIds]
  );

  const acceptedRequests = useMemo(
    () => requests.filter((r) => !hiddenIds.has(String(r.id)) && isAcceptedStatus(r.status)),
    [requests, hiddenIds]
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

  const toggleSelectId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredRequests.length && filteredRequests.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRequests.map((r) => String(r.id))));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    Alert.alert(
      t('sent.sentrequestsscreen.delete_invitations', { defaultValue: 'Delete Invitations' }),
      t('sent.sentrequestsscreen.delete_confirm', {
        defaultValue: `Are you sure you want to delete ${count} invitation${count > 1 ? 's' : ''}?`,
      }),
      [
        { text: t('common.cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
        {
          text: t('common.delete', { defaultValue: 'Delete' }),
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const toDelete = Array.from(selectedIds);
              await Promise.allSettled(toDelete.map((id) => cancel.mutateAsync(id)));
              const nextHidden = new Set([...Array.from(hiddenIds), ...toDelete]);
              setHiddenIds(nextHidden);
              await AsyncStorage.setItem(
                '@deleted_invitations',
                JSON.stringify(Array.from(nextHidden))
              );
              setSelectedIds(new Set());
              setIsSelectMode(false);
              refreshAll();
            } catch (err: any) {
              Alert.alert(
                t('profile.additionaluploadsection.error', { defaultValue: 'Error' }),
                getUserFriendlyMessage(err, 'Failed to delete selected invitations.')
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

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
    if (!effectiveIsSubscribed && !isUserWoman) {
      setPaywallVisible?.(true);
      return;
    }
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
    const rawPhoto =
      receiver.photo ||
      receiver.profileImageUrl ||
      receiver.photoUrl ||
      receiver.image ||
      (Array.isArray(receiver.photos) && receiver.photos[0]) ||
      (Array.isArray(receiver.images) && receiver.images[0]) ||
      (item as any).receiverPhoto ||
      (item as any).receiverImage ||
      null;
    const photoUrl = rawPhoto
      ? getAbsoluteUrl(rawPhoto) || rawPhoto
      : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800';

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
        mobile: receiver.mobile || receiver.phoneNumber || receiver.phone || '',
        phone: receiver.phone || receiver.mobile || receiver.phoneNumber || '',
        phoneNumber: receiver.phoneNumber || receiver.mobile || receiver.phone || '',
        telegramUsername: receiver.telegramUsername || '',
      },
      image: photoUrl,
      requestId: item.id,
      requestRole: 'sent',
      requestStatus: item.status,
    });
  };

  const renderCard = ({ item }: { item: ConnectionRequest }) => {
    const receiver = item.receiver || {};
    const rawPhoto =
      receiver.photo ||
      receiver.profileImageUrl ||
      receiver.photoUrl ||
      receiver.image ||
      (Array.isArray(receiver.photos) && receiver.photos[0]) ||
      (Array.isArray(receiver.images) && receiver.images[0]) ||
      (item as any).receiverPhoto ||
      (item as any).receiverImage ||
      null;
    const photoUrl = rawPhoto
      ? getAbsoluteUrl(rawPhoto) || rawPhoto
      : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800';

    const displayName = cleanDisplayName(receiver.displayName || receiver.name);
    const age = receiver.age ? `, ${receiver.age}` : '';
    const timeText = formatRelativeTime(item.createdAt);
    const itemIdStr = String(item.id);
    const isSelected = selectedIds.has(itemIdStr);
    const receiverPhone = receiver.phoneNumber || receiver.mobile || receiver.phone || '';
    const receiverTg = receiver.telegramUsername || '';
    const hasWhatsApp = Boolean(receiverPhone);
    const hasTelegram = Boolean(receiverTg);

    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
        activeOpacity={0.8}
        onPress={() => {
          if (isSelectMode) {
            toggleSelectId(itemIdStr);
          } else {
            handleOpenProfile(item);
          }
        }}
      >
        {isSelectMode && (
          <View style={styles.selectCheckboxWrap}>
            <Icon
              name={isSelected ? 'check-circle' : 'checkbox-blank-circle-outline'}
              size={22}
              color={isSelected ? themeColors.primary : themeColors.textMuted}
            />
          </View>
        )}
        <Image source={{ uri: photoUrl }} style={styles.avatar} />

        <View style={styles.cardInfo} pointerEvents={isSelectMode ? 'none' : 'auto'}>
          <Text style={styles.nameAgeText} numberOfLines={1}>
            {displayName}{age}
          </Text>
          <Text style={styles.statusSubtext} numberOfLines={1}>
            {activeTab === 'accepted'
              ? hasWhatsApp || hasTelegram
                ? t('requests.requestsinboxscreen.request_accepted', { defaultValue: 'Invitation Accepted' })
                : t('profile.contactdetails.awaiting_contact', { defaultValue: 'Awaiting contact info' })
              : t('sent.sentrequestsscreen.pending_reply', { defaultValue: 'Pending reply' })}
          </Text>
        </View>

        <View style={styles.rightCol}>
          <Text style={styles.timestampText}>{timeText}</Text>

          {!isSelectMode && activeTab === 'accepted' ? (
            item.accessExpired || (!effectiveIsSubscribed && !isUserWoman) ? (
              <TouchableOpacity
                style={styles.restoreBtnWrapper}
                activeOpacity={0.8}
                onPress={() => {
                  if (!effectiveIsSubscribed && !isUserWoman) {
                    setPaywallVisible?.(true);
                    return;
                  }
                  handleRestoreAccess(item);
                }}
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
                      <Text style={styles.restoreBtnText}>
                        {!effectiveIsSubscribed && !isUserWoman
                          ? t('profile.userdetails.upgrade', { defaultValue: 'Upgrade' })
                          : t('sent.sentrequestsscreen.restore_access')}
                      </Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ) : hasWhatsApp && hasTelegram ? (
              <View style={styles.multiChatRow}>
                <TouchableOpacity
                  style={styles.whatsAppIconBtn}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (!effectiveIsSubscribed && !isUserWoman) {
                      setPaywallVisible?.(true);
                      return;
                    }
                    openWhatsAppChat(receiverPhone);
                  }}
                >
                  <Icon name="whatsapp" size={17} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.telegramIconBtn}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (!effectiveIsSubscribed && !isUserWoman) {
                      setPaywallVisible?.(true);
                      return;
                    }
                    openTelegramChat(receiverTg);
                  }}
                >
                  <Icon name="send" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : hasWhatsApp ? (
              <TouchableOpacity
                style={styles.whatsAppIconBtn}
                activeOpacity={0.8}
                onPress={() => {
                  if (!effectiveIsSubscribed && !isUserWoman) {
                    setPaywallVisible?.(true);
                    return;
                  }
                  openWhatsAppChat(receiverPhone);
                }}
              >
                <Icon name="whatsapp" size={17} color="#FFFFFF" />
              </TouchableOpacity>
            ) : hasTelegram ? (
              <TouchableOpacity
                style={styles.telegramIconBtn}
                activeOpacity={0.8}
                onPress={() => {
                  if (!effectiveIsSubscribed && !isUserWoman) {
                    setPaywallVisible?.(true);
                    return;
                  }
                  openTelegramChat(receiverTg);
                }}
              >
                <Icon name="send" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.profileIconBtn}
                activeOpacity={0.8}
                onPress={() => {
                  handleOpenProfile(item);
                }}
              >
                <Icon name="account-outline" size={18} color={themeColors.textSecondary} />
              </TouchableOpacity>
            )
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  const hasAnyInvitations = requests.some((r) => !hiddenIds.has(String(r.id)));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Notification Banner */}
      <NotificationBanner />

      {/* Top Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>{t('messages.messagescreen.invitations')}</Text>
        {hasAnyInvitations && (
          <View style={styles.headerActions}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.selectBtn}
              onPress={() => {
                if (isSelectMode) {
                  setIsSelectMode(false);
                  setSelectedIds(new Set());
                } else {
                  setIsSelectMode(true);
                  setSelectedIds(new Set());
                }
              }}
            >
              <Text style={styles.selectText}>
                {isSelectMode
                  ? t('common.cancel', { defaultValue: 'Cancel' })
                  : t('requests.requestsinboxscreen.select')}
              </Text>
            </TouchableOpacity>
            {!isSelectMode && (
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.refreshBtn}
                onPress={refreshAll}
              >
                <Icon name="sync" size={20} color={themeColors.primary} />
              </TouchableOpacity>
            )}
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
                  {acceptedRequests.length > 0 && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>
                        {acceptedRequests.length > 9 ? '9+' : acceptedRequests.length}
                      </Text>
                    </View>
                  )}
                </LinearGradient>
              ) : (
                <View style={styles.segmentPillInactive}>
                  <Text style={styles.segmentTextInactive}>{t('requests.requestsinboxscreen.accepted')}</Text>
                  {acceptedRequests.length > 0 && (
                    <View style={styles.countBadgeInactive}>
                      <Text style={styles.countBadgeInactiveText}>
                        {acceptedRequests.length > 9 ? '9+' : acceptedRequests.length}
                      </Text>
                    </View>
                  )}
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
                  refreshing={manualRefreshing}
                  onRefresh={handleManualRefresh}
                  tintColor={themeColors.primary}
                  colors={[themeColors.primary]}
                />
              }
            />
          )}
        </>
      )}

      {/* Multi-Select Floating Bottom Bar */}
      {isSelectMode && filteredRequests.length > 0 && (
        <View style={[styles.bottomSelectBar, { bottom: Math.max(insets.bottom, 12) + Spacing.tabBarHeight + 10 }]}>
          <TouchableOpacity
            style={styles.selectAllBtn}
            onPress={handleToggleSelectAll}
            activeOpacity={0.7}
          >
            <Text style={styles.selectAllText}>
              {selectedIds.size === filteredRequests.length && filteredRequests.length > 0
                ? t('common.deselect_all', { defaultValue: 'Deselect All' })
                : t('common.select_all', { defaultValue: 'Select All' })}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteBatchBtn, selectedIds.size === 0 && styles.deleteBatchBtnDisabled]}
            onPress={handleBulkDelete}
            disabled={selectedIds.size === 0 || isDeleting}
            activeOpacity={0.8}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Icon name="trash-can-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.deleteBatchText}>
                  {t('common.delete', { defaultValue: 'Delete' })} ({selectedIds.size})
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
      paddingHorizontal: 18,
      paddingTop: 10,
      paddingBottom: 6,
    },
    headerTitle: {
      color: colors.text,
      fontSize: 20,
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
    cardSelected: {
      backgroundColor: colors.surfaceLight || 'rgba(255, 255, 255, 0.05)',
    },
    selectCheckboxWrap: {
      marginRight: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    bottomSelectBar: {
      position: 'absolute',
      left: 18,
      right: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      zIndex: 9999,
      elevation: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    selectAllBtn: {
      paddingVertical: 6,
      paddingHorizontal: 10,
    },
    selectAllText: {
      color: colors.primary,
      fontSize: 14.5,
      fontWeight: '600',
    },
    deleteBatchBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#EF4444',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 18,
    },
    deleteBatchBtnDisabled: {
      backgroundColor: colors.surfaceLight || '#2A2A38',
      opacity: 0.4,
    },
    deleteBatchText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
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
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 3,
    },
    statusSubtext: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '500',
    },
    rightCol: {
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      alignSelf: 'stretch',
      marginLeft: 10,
      paddingVertical: 2,
    },
    restoreBtnWrapper: {
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
      backgroundColor: '#0088cc',
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    multiChatRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    whatsAppIconBtn: {
      backgroundColor: '#25D366',
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
    },
    telegramIconBtn: {
      backgroundColor: '#0088cc',
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileIconBtn: {
      backgroundColor: colors.surfaceLight || 'rgba(255, 255, 255, 0.08)',
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chatBtnText: {
      color: '#FFFFFF',
      fontSize: 12.5,
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
      fontSize: 12,
      fontWeight: '400',
      marginBottom: 6,
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
      width: 148,
      height: 104,
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    pyramidAvatar: {
      borderRadius: 999,
      backgroundColor: '#1E1B2E',
    },
    avatarTopLeft: {
      position: 'absolute',
      top: 0,
      left: 10,
      width: 58,
      height: 58,
      borderRadius: 29,
      borderWidth: 2.5,
      borderColor: '#FFFFFF',
      zIndex: 1,
    },
    avatarTopRight: {
      position: 'absolute',
      top: 0,
      right: 10,
      width: 58,
      height: 58,
      borderRadius: 29,
      borderWidth: 2.5,
      borderColor: '#FFFFFF',
      zIndex: 1,
    },
    avatarBottomCenterWrapper: {
      position: 'absolute',
      bottom: 0,
      width: 68,
      height: 68,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
    },
    avatarBottomCenter: {
      width: 68,
      height: 68,
      borderRadius: 34,
      borderWidth: 3,
      borderColor: '#FFFFFF',
    },
    envelopeBadge: {
      position: 'absolute',
      bottom: -1,
      right: -1,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: '#FFFFFF',
      borderWidth: 1.5,
      borderColor: '#E2E8F0',
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 2 },
      zIndex: 3,
    },
    envelopeIcon: {
      width: 12,
      height: 12,
    },
    emptyInvitesTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '600',
      textAlign: 'center',
      lineHeight: 22,
      marginTop: 14,
    },
    emptyInvitesSubtitle: {
      color: colors.textSecondary,
      fontSize: 12.5,
      textAlign: 'center',
      lineHeight: 18,
      marginTop: 8,
      marginHorizontal: 16,
    },
    inviteNowBtnWrapper: {
      borderRadius: 20,
      overflow: 'hidden',
      marginTop: 18,
    },
    inviteNowBtn: {
      paddingHorizontal: 28,
      paddingVertical: 10,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    inviteNowText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
  });
