import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import NotificationBanner from '../../components/NotificationBanner';
import { useConnection, ConnectionRequest } from '../../api/useConnection';
import AppContext from '../../context/CreateGlobalStateContext';
import { Colors, Spacing, useTheme } from '../../theme';
import { getAbsoluteUrl } from '../../api/apiClient';
import { getUserFriendlyMessage } from '../../utils/userFriendlyMessages';
import { openTelegramChat } from '../../utils/telegramHelper';
import { openWhatsAppChat } from '../../utils/whatsappHelper';
import { t, useTranslation } from '../../i18n';

const RequestsInboxScreen: React.FC = () => {
  useTranslation();
  const { themeColors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { setViewMyProfile, setCardUserName, setCardUserAge, setSelectedUserImage, setPaywallVisible, isSubscribed, gender } =
    useContext(AppContext);

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
  const { receivedList, accept, reject, refreshAll } = useConnection();

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

  // Tabs: 'accepted' on left, 'pending' on right (Screenshot 4B & 4C)
  const [activeTab, setActiveTab] = useState<'accepted' | 'pending'>(
    route?.params?.initialTab || 'pending'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [approvedMatch, setApprovedMatch] = useState<{
    name: string;
    photo: string;
    username?: string;
    phoneNumber?: string;
  } | null>(null);

  const { data: requests = [], isLoading, isRefetching } = receivedList;

  // Auto-refetch when user focuses this screen
  useFocusEffect(
    useCallback(() => {
      if (route?.params?.initialTab) {
        setActiveTab(route.params.initialTab);
      }
      refreshAll();
    }, [route?.params?.initialTab])
  );

  const isAcceptedStatus = (status?: string) => {
    const s = String(status || '').trim().toUpperCase();
    return s === 'ACCEPTED' || s === 'APPROVED';
  };

  // Split into accepted vs pending (excluding deleted items)
  const acceptedRequests = useMemo(
    () => requests.filter((r) => !hiddenIds.has(String(r.id)) && isAcceptedStatus(r.status)),
    [requests, hiddenIds]
  );

  const pendingRequests = useMemo(
    () =>
      requests.filter(
        (r) =>
          !hiddenIds.has(String(r.id)) &&
          !isAcceptedStatus(r.status) &&
          r.status !== 'DECLINED' &&
          r.status !== 'CANCELLED' &&
          r.status !== 'REJECTED'
      ),
    [requests, hiddenIds]
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
              await Promise.allSettled(toDelete.map((id) => reject.mutateAsync(id)));
              const nextHidden = new Set([...Array.from(hiddenIds), ...toDelete]);
              setHiddenIds(nextHidden);
              await AsyncStorage.setItem(
                '@deleted_invitations',
                JSON.stringify(Array.from(nextHidden))
              );
              setSelectedIds(new Set());
              setIsSelectMode(false);
              refreshAll();
              Toast.show({
                type: 'info',
                text1: 'Invitations Deleted',
                text2: `Removed ${count} invitation${count > 1 ? 's' : ''}.`,
                visibilityTime: 2500,
              });
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
      refreshAll();
      const approvedRequest = approvalResponse?.data || approvalResponse;
      const sender = request.sender || {};
      const photoUrl =
        sender.photo ||
        (sender.photos && sender.photos[0]) ||
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800';

      const approvedPhone =
        approvedRequest?.sender?.phoneNumber ||
        approvedRequest?.sender?.mobile ||
        approvedRequest?.sender?.phone ||
        sender.phoneNumber ||
        sender.mobile ||
        sender.phone ||
        '';

      const approvedTg =
        approvedRequest?.sender?.telegramUsername ||
        sender.telegramUsername ||
        '';

      setApprovedMatch({
        name: sender.displayName || sender.name || t('requests.requestsinboxscreen.dating_match'),
        photo: photoUrl,
        username: approvedTg,
        phoneNumber: approvedPhone,
      });
    } catch (err: any) {
      Alert.alert(
        'Could not approve invitation',
        getUserFriendlyMessage(err, t('profile.userdetails.please_try_again_in_a_moment'))
      );
    }
  };

  const handleDecline = async (request: ConnectionRequest) => {
    try {
      await reject.mutateAsync(request.id);
      refreshAll();
      const sender = request.sender || {};
      const senderName = cleanDisplayName(sender.displayName || sender.name);
      Toast.show({
        type: 'info',
        text1: 'Invitation Declined',
        text2: `Declined date proposal from ${senderName}.`,
        visibilityTime: 2500,
      });
    } catch (err: any) {
      Alert.alert(
        'Could not decline invitation',
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
        mobile: sender.mobile || sender.phoneNumber || sender.phone || '',
        phone: sender.phone || sender.mobile || sender.phoneNumber || '',
        phoneNumber: sender.phoneNumber || sender.mobile || sender.phone || '',
        telegramUsername: sender.telegramUsername || '',
      },
      image: photoUrl,
      requestId: item.id,
      requestRole: 'received',
      requestStatus: item.status,
    });
  };

  const handleOpenTelegram = (username?: string) => {
    if (!isSubscribed && !isUserWoman) {
      setPaywallVisible?.(true);
      return;
    }
    openTelegramChat(username);
  };

  const renderCard = ({ item }: { item: ConnectionRequest }) => {
    const sender = item.sender || {};
    const rawPhoto =
      sender.photo ||
      sender.profileImageUrl ||
      sender.photoUrl ||
      sender.image ||
      (Array.isArray(sender.photos) && sender.photos[0]) ||
      (Array.isArray(sender.images) && sender.images[0]) ||
      (item as any).senderPhoto ||
      (item as any).senderImage ||
      null;
    const photoUrl = rawPhoto
      ? getAbsoluteUrl(rawPhoto) || rawPhoto
      : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800';

    const displayName = cleanDisplayName(sender.displayName || sender.name);
    const statusText = formatStatusDate(item);
    const isApproved = isAcceptedStatus(item.status);
    const itemIdStr = String(item.id);
    const isSelected = selectedIds.has(itemIdStr);
    const senderPhone = sender.phoneNumber || sender.mobile || sender.phone || '';
    const senderTg = sender.telegramUsername || '';
    const hasWhatsApp = Boolean(senderPhone);
    const hasTelegram = Boolean(senderTg);

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
          <Text style={styles.nameText} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.statusSubtext} numberOfLines={1}>
            {isApproved
              ? hasWhatsApp || hasTelegram
                ? t('requests.requestsinboxscreen.request_accepted', { defaultValue: 'Invitation Accepted' })
                : t('profile.contactdetails.awaiting_contact', { defaultValue: 'Awaiting contact info' })
              : statusText}
          </Text>
        </View>

        {!isSelectMode && !isApproved && (
          <View style={styles.cardActionsRow}>
            <TouchableOpacity
              style={styles.declineBtn}
              onPress={() => handleDecline(item)}
              activeOpacity={0.8}
            >
              <Text style={styles.declineBtnText}>{t('common.decline', { defaultValue: 'Decline' })}</Text>
            </TouchableOpacity>

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
          </View>
        )}

        {!isSelectMode && isApproved && (
          hasWhatsApp && hasTelegram ? (
            <View style={styles.multiChatRow}>
              <TouchableOpacity
                style={styles.whatsAppIconBtn}
                activeOpacity={0.8}
                onPress={() => {
                  if (!isSubscribed && !isUserWoman) {
                    setPaywallVisible?.(true);
                    return;
                  }
                  openWhatsAppChat(senderPhone);
                }}
              >
                <Icon name="whatsapp" size={17} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.telegramIconBtn}
                activeOpacity={0.8}
                onPress={() => {
                  if (!isSubscribed && !isUserWoman) {
                    setPaywallVisible?.(true);
                    return;
                  }
                  handleOpenTelegram(senderTg);
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
                if (!isSubscribed && !isUserWoman) {
                  setPaywallVisible?.(true);
                  return;
                }
                openWhatsAppChat(senderPhone);
              }}
            >
              <Icon name="whatsapp" size={17} color="#FFFFFF" />
            </TouchableOpacity>
          ) : hasTelegram ? (
            <TouchableOpacity
              style={styles.telegramIconBtn}
              activeOpacity={0.8}
              onPress={() => {
                if (!isSubscribed && !isUserWoman) {
                  setPaywallVisible?.(true);
                  return;
                }
                handleOpenTelegram(senderTg);
              }}
            >
              <Icon name="send" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.profileIconBtn}
              onPress={() => {
                handleOpenProfile(item);
              }}
              activeOpacity={0.8}
            >
              <Icon name="account-outline" size={18} color={themeColors.textSecondary} />
            </TouchableOpacity>
          )
        )}
      </TouchableOpacity>
    );
  };

  const hasAnyInvitations = requests.some((r) => !hiddenIds.has(String(r.id)));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Notification Banner */}
      <NotificationBanner />

      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.brandTitle}>{t('messages.messagescreen.invitations')}</Text>
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
          >
            {t('requests.requestsinboxscreen.accepted')} ({acceptedRequests.length})
          </Text>
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
            {t('requests.requestsinboxscreen.pending')} ({pendingRequests.length})
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
          {acceptedRequests.length > 0 && (
            <TouchableOpacity
              style={{
                marginTop: 16,
                paddingVertical: 10,
                paddingHorizontal: 20,
                backgroundColor: themeColors.primary,
                borderRadius: 24,
              }}
              onPress={() => setActiveTab('accepted')}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>
                View Accepted Invitations ({acceptedRequests.length})
              </Text>
            </TouchableOpacity>
          )}
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
            {approvedMatch?.phoneNumber ? (
              <TouchableOpacity
                style={[styles.modalTelegramBtnWrapper, { marginBottom: 10 }]}
                onPress={() => {
                  const phone = approvedMatch?.phoneNumber;
                  setApprovedMatch(null);
                  if (phone) openWhatsAppChat(phone);
                }}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#25D366', '#128C7E']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modalTelegramBtn}
                >
                  <Icon name="whatsapp" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.modalTelegramBtnText}>
                    {t('profile.contactdetails.open_whatsapp', { defaultValue: 'Open WhatsApp' })}: {approvedMatch.phoneNumber}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : null}

            {approvedMatch?.username ? (
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
                  <Icon name="send" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.modalTelegramBtnText}>
                    {t('profile.userdetails.open_telegram', { defaultValue: 'Open Telegram' })}: @{approvedMatch.username.replace(/^@+/, '')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => {
                setApprovedMatch(null);
                setActiveTab('accepted');
              }}
            >
              <Text style={styles.modalDoneBtnText}>{t('profile.userdetails.done')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
      paddingHorizontal: 18,
      paddingTop: 10,
      paddingBottom: 6,
    },
    brandTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '700',
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
    cardActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    declineBtn: {
      borderRadius: 18,
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceLight || 'rgba(255,255,255,0.06)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    declineBtnText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '600',
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
      fontSize: 13,
      fontWeight: '700',
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
    bellBadge: {
      position: 'absolute',
      top: -2,
      right: -2,
      backgroundColor: colors.primary,
      borderRadius: 9,
      minWidth: 16,
      height: 16,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    bellBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '800',
    },
  });
