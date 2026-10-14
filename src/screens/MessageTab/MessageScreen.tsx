import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import AvatarGroup from '../../components/MessageTabComponents/AvatarGroup';
import InviteButton from '../../components/MessageTabComponents/InviteButton';
import { getGender } from '../../utils/types/AsyncStorage';
import AppContext from '../../context/CreateGlobalStateContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { getUserId } from '../../utils/sessionHelper';
import useSubscriptionGate from '../../utils/useSubscriptionGate';
import { useConnection } from '../../api/useConnection';
import { getAbsoluteUrl } from '../../api/apiClient';
import { Colors, Spacing, Shadows, Typography, useTheme } from '../../theme';
import { useAlert } from '../../components/AlertModal';
import { t, useTranslation } from '../../i18n';

export default function MessageScreen() {
  useTranslation();
  const { themeColors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const { alert, AlertComponent } = useAlert();
  const navigation = useNavigation<any>();
  const [userId, setUserId] = useState<string | null>(null);
  const [activeMainTab, setActiveMainTab] = useState<'invitations' | 'messages'>('invitations');
  const [activeInviteTab, setActiveInviteTab] = useState<'Sent' | 'Received'>('Sent');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getUserId().then(setUserId);
  }, []);

  const connection = useConnection(userId || undefined);
  const { requireSubscription } = useSubscriptionGate();

  const formatInviteTime = (value?: string) => {
    if (!value) return 'now';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'now';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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

  const resolveUserImage = (targetUser: any, profile: any) => {
    const imagePath = [
      profile?.profileImageUrl,
      targetUser?.profileImageUrl,
      targetUser?.photo,
      profile?.photo,
      profile?.imageUrl,
      targetUser?.imageUrl,
      profile?.photos,
      targetUser?.photos,
      profile?.images,
      targetUser?.images,
    ]
      .map(extractFirstImagePath)
      .find(Boolean) || null;
    return imagePath ? getAbsoluteUrl(imagePath) : null;
  };

  const resolveUserAge = (profile: any, targetUser: any) => {
    if (profile?.age != null && profile?.age !== '' && Number(profile.age) > 0) {
      return profile.age;
    }
    if (targetUser?.age != null && targetUser?.age !== '' && Number(targetUser.age) > 0) {
      return targetUser.age;
    }
    const dob = profile?.dob || targetUser?.dob;
    if (dob) {
      const dobDate = new Date(dob);
      if (!isNaN(dobDate.getTime())) {
        const today = new Date();
        let calculatedAge = today.getFullYear() - dobDate.getFullYear();
        const m = today.getMonth() - dobDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
          calculatedAge--;
        }
        if (calculatedAge > 0 && calculatedAge < 120) return calculatedAge;
      }
    }
    return '';
  };

  const resolveUserName = (profile: any, targetUser: any) => {
    const raw =
      profile?.displayName ||
      targetUser?.displayName ||
      targetUser?.name ||
      targetUser?.fullName ||
      targetUser?.username ||
      '';
    let trimmed = String(raw).trim();
    trimmed = trimmed.replace(/,\s*\d+$/, '').trim();
    return trimmed || t('home.usercard.user');
  };

  const normalizeInvite = useCallback((request: any, mode: 'sent' | 'received') => {
    const targetUser = mode === 'sent' ? request?.receiver : request?.sender;
    const profile = targetUser?.profile;
    return {
      id: request?.id,
      requestId: request?.id,
      userId: targetUser?.id,
      name: resolveUserName(profile, targetUser),
      age: resolveUserAge(profile, targetUser),
      image: resolveUserImage(targetUser, profile),
      time: formatInviteTime(request?.updatedAt || request?.createdAt),
      status: request?.status || 'PENDING',
      online: profile?.online ?? targetUser?.online ?? false,
    };
  }, []);

  const normalizeChat = useCallback((request: any) => {
    const currentUserId = userId ? String(userId) : null;
    const sender = request?.sender;
    const receiver = request?.receiver;
    const targetUser = String(sender?.id) === currentUserId ? receiver : sender;
    const profile = targetUser?.profile;
    const status = String(request?.status || 'CONNECTED').toUpperCase();
    return {
      id: String(request?.id || targetUser?.id || `${status}-${Date.now()}`),
      name: resolveUserName(profile, targetUser),
      lastMsg: status === 'APPROVED' ? 'You are connected. Start the conversation.' : t('messages.messagescreen.connection_status', { status }),
      time: formatInviteTime(request?.updatedAt || request?.createdAt),
      unread: 0,
      image: resolveUserImage(targetUser, profile),
      online: profile?.online ?? targetUser?.online ?? false,
    };
  }, [userId]);

  const { setOppositeGender } = useContext(AppContext);

  const sentInvites = useMemo(() => {
    const items = Array.isArray(connection.sentList.data) ? connection.sentList.data : [];
    return items
      .map((item: any) => normalizeInvite(item, 'sent'))
      .filter((item: any) => {
        const status = String(item?.status || 'PENDING').trim().toUpperCase();
        return status === 'PENDING';
      });
  }, [connection.sentList.data, normalizeInvite]);

  const receivedInvites = useMemo(() => {
    const items = Array.isArray(connection.receivedList.data) ? connection.receivedList.data : [];
    return items
      .map((item: any) => normalizeInvite(item, 'received'))
      .filter((item: any) => {
        const status = String(item?.status || 'PENDING').trim().toUpperCase();
        return status === 'PENDING';
      });
  }, [connection.receivedList.data, normalizeInvite]);

  const connectionChats = useMemo(() => {
    const items = Array.isArray(connection.connectionList.data) ? connection.connectionList.data : [];
    return items.map((item: any) => normalizeChat(item));
  }, [connection.connectionList.data, normalizeChat]);

  const sentLoading = Boolean(userId) && (connection.sentList.isLoading || connection.sentList.isRefetching);
  const receivedLoading = Boolean(userId) && (connection.receivedList.isLoading || connection.receivedList.isRefetching);
  const messagesLoading = Boolean(userId) && (connection.connectionList.isLoading || connection.connectionList.isRefetching);

  const handleAccept = (item: any) => {
    const targetRequestId = item.requestId || item.id;
    connection.accept.mutate(targetRequestId, {
      onSuccess: () => {
        void connection.receivedList.refetch();
        void connection.sentList.refetch();
        void connection.connectionList.refetch();
        Toast.show({ type: 'success', text1: t('messages.messagescreen.invitation_accepted'), text2: t('messages.messagescreen.you_can_now_chat_with', { item: item.name || item.username || 'them' }) });
        setActiveMainTab('messages');
      },
      onError: () => { alert(t('profile.additionaluploadsection.error'), t('messages.messagescreen.failed_to_accept_invitation')); },
    });
  };

  useEffect(() => {
    const fetchGender = async () => {
      const gender = await getGender();
      if (gender === 'straight_woman') setOppositeGender('straight_man');
      else if (gender === 'straight_man') setOppositeGender('straight_woman');
      else setOppositeGender('lgbtqia');
    };
    fetchGender();
  }, [setOppositeGender]);

  const isInvitesLoading = activeInviteTab === 'Sent' ? sentLoading : receivedLoading;
  const displaySentInvites = sentInvites.length > 0 ? sentInvites : [];
  const displayReceivedInvites = receivedInvites.length > 0 ? receivedInvites : [];
  const displayChats = connectionChats;
  const filteredChats = searchQuery.trim()
    ? displayChats.filter((chat: any) =>
        chat.name?.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : displayChats;

  const renderInviteItem = ({ item }: { item: any }) => (
    <View style={styles.listItem}>
      <View style={styles.avatarBox}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.avatar} />
        ) : (
          <View style={styles.placeholderAvatar}>
            <Icon name="account" size={28} color={Colors.textMuted} />
          </View>
        )}
        {item.online && <View style={styles.onlineDot} />}
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemName} numberOfLines={1}>
          {item.age ? `${item.name}, ${item.age}` : item.name}
        </Text>
        <View style={styles.itemStatusRow}>
          {activeInviteTab === 'Received' ? (
            <>
              <Icon name="clock-check-outline" size={13} color={Colors.secondary} />
              <Text style={styles.itemStatusLabel}>{t('messages.messagescreen.invited_you')}</Text>
            </>
          ) : null}
          {item.time ? (
            <View style={styles.inviteDateContainer}>
              {activeInviteTab === 'Received' ? <Text style={styles.dotSeparator}>•</Text> : null}
              <Text style={styles.itemDateText}>{item.time}</Text>
            </View>
          ) : null}
        </View>
      </View>
      {activeInviteTab === 'Received' ? (
        <TouchableOpacity
          style={styles.actionPill}
          activeOpacity={0.8}
          onPress={() => handleAccept(item)}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.actionGradient}
          >
            <Text style={styles.actionPillText}>{t('messages.messagescreen.accept')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const renderChatItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.listItem}
      activeOpacity={0.7}
      onPress={() =>
        requireSubscription(() =>
          navigation.navigate('ChatDetailScreen', { name: item.name, image: item.image })
        )
      }
    >
      <View style={styles.avatarBox}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.avatar} />
        ) : (
          <View style={styles.placeholderAvatar}>
            <Icon name="account" size={28} color={Colors.textMuted} />
          </View>
        )}
        {item.online && <View style={styles.onlineDot} />}
      </View>
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemTime}>{item.time}</Text>
        </View>
        <Text style={[styles.lastMsg, item.unread > 0 && styles.unreadMsg]} numberOfLines={1}>
          {item.lastMsg}
        </Text>
      </View>
      {item.unread > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadCount}>{item.unread}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <View style={styles.mainNav}>
        <TouchableOpacity
          style={[styles.navBtn, activeMainTab === 'invitations' && styles.activeNavBtn]}
          onPress={() => setActiveMainTab('invitations')}
        >
          <Icon name="email-outline" size={24} color={activeMainTab === 'invitations' ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.navText, activeMainTab === 'invitations' && styles.activeNavText]}>{t('messages.messagescreen.invitations')}</Text>
          {activeMainTab === 'invitations' && <View style={styles.navIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtn, activeMainTab === 'messages' && styles.activeNavBtn]}
          onPress={() => requireSubscription(() => setActiveMainTab('messages'))}
        >
          <Icon name="chat-processing-outline" size={24} color={activeMainTab === 'messages' ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.navText, activeMainTab === 'messages' && styles.activeNavText]}>{t('messages.messagescreen.messages')}</Text>
          {activeMainTab === 'messages' && <View style={styles.navIndicator} />}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeMainTab === 'invitations' ? (
          <View style={{ flex: 1 }}>
            <View style={styles.subTabs}>
              <TouchableOpacity onPress={() => setActiveInviteTab('Sent')} style={[styles.subTab, activeInviteTab === 'Sent' && styles.activeSubTab]}>
                <Text style={[styles.subTabText, activeInviteTab === 'Sent' && styles.activeSubTabText]}>
                  {t('messages.messagescreen.sent', { sentInvites: sentInvites?.length || 0 })}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveInviteTab('Received')} style={[styles.subTab, activeInviteTab === 'Received' && styles.activeSubTab]}>
                <Text style={[styles.subTabText, activeInviteTab === 'Received' && styles.activeSubTabText]}>
                  {t('messages.messagescreen.received', { receivedInvites: receivedInvites?.length || 0 })}
                </Text>
              </TouchableOpacity>
            </View>

            {isInvitesLoading ? (
              <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color={Colors.primary} /></View>
            ) : (activeInviteTab === 'Sent' ? displaySentInvites?.length : displayReceivedInvites?.length) > 0 ? (
              <FlatList
                data={activeInviteTab === 'Sent' ? displaySentInvites : displayReceivedInvites}
                renderItem={renderInviteItem}
                keyExtractor={item => item.id?.toString() || Math.random().toString()}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.emptyView}>
                <AvatarGroup />
                <Text style={styles.emptyTitle}>{t('messages.messagescreen.no_invitations_yet')}</Text>
                <Text style={styles.emptyDesc}>{t('messages.messagescreen.invite_people_you_like_to_start_a_conversation')}</Text>
                <View style={{ width: '80%', marginTop: Spacing.xl }}><InviteButton /></View>
              </View>
            )}
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <View style={styles.searchContainer}>
              <Icon name="magnify" size={20} color={Colors.textMuted} />
              <TextInput placeholder={t('messages.messagescreen.search_messages')} style={styles.searchInput} placeholderTextColor={Colors.textMuted} value={searchQuery} onChangeText={setSearchQuery} />
            </View>

            {messagesLoading ? (
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <ActivityIndicator color={Colors.primary} />
              </View>
            ) : filteredChats.length > 0 ? (
              <FlatList
                data={filteredChats}
                renderItem={renderChatItem}
                keyExtractor={item => String(item.id)}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.emptyView}>
                <AvatarGroup />
                <Text style={styles.emptyTitle}>{t('messages.chatdetailscreen.no_messages_yet')}</Text>
                <Text style={styles.emptyDesc}>{t('messages.messagescreen.accepted_connections_will_appear_here_for_quick_access')}</Text>
                <View style={{ width: '80%', marginTop: Spacing.xl }}><InviteButton /></View>
              </View>
            )}
          </View>
        )}
      </View>
      {AlertComponent}
    </SafeAreaView>
  );
}

const createStyles = (themeColors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    mainNav: {
      flexDirection: 'row',
      height: 64,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.divider,
      backgroundColor: themeColors.surface,
      marginHorizontal: Spacing.screenPaddingHorizontal,
      marginTop: Spacing.sm,
      borderRadius: Spacing.radiusXl,
      overflow: 'hidden',
    },
    navBtn: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 2,
      position: 'relative',
    },
    navText: {
      fontSize: 12,
      fontWeight: '700',
      color: themeColors.textMuted,
    },
    activeNavText: {
      color: themeColors.text,
    },
    navIndicator: {
      position: 'absolute',
      bottom: 0,
      width: '50%',
      height: 3,
      backgroundColor: themeColors.primary,
      borderRadius: 3,
    },
    activeNavBtn: {},
    content: {
      flex: 1,
    },
    subTabs: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.screenPaddingHorizontal,
      paddingTop: Spacing.md,
      gap: Spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.divider,
    },
    subTab: {
      paddingBottom: Spacing.md,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    activeSubTab: {
      borderBottomColor: themeColors.primary,
    },
    subTabText: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.textMuted,
    },
    activeSubTabText: {
      color: themeColors.text,
      fontWeight: '800',
    },
    listContainer: {
      paddingHorizontal: Spacing.screenPaddingHorizontal,
      paddingTop: Spacing.sm,
      paddingBottom: 120,
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.divider,
    },
    avatarBox: {
      position: 'relative',
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: themeColors.surface,
      borderWidth: 2,
      borderColor: themeColors.glassBorder,
    },
    placeholderAvatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: themeColors.surfaceLight,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: themeColors.glassBorder,
    },
    onlineDot: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: themeColors.online,
      borderWidth: 2,
      borderColor: themeColors.background,
    },
    itemContent: {
      flex: 1,
      marginLeft: Spacing.md,
      marginRight: Spacing.sm,
      justifyContent: 'center',
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 3,
    },
    itemName: {
      fontSize: 16,
      fontWeight: '700',
      color: themeColors.text,
      marginBottom: 2,
    },
    itemTime: {
      fontSize: 12,
      color: themeColors.textMuted,
      fontWeight: '500',
    },
    itemStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    inviteDateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    itemStatusLabel: {
      fontSize: 13,
      color: themeColors.secondary,
      fontWeight: '600',
    },
    dotSeparator: {
      fontSize: 12,
      color: themeColors.textMuted,
      marginHorizontal: 3,
    },
    itemDateText: {
      fontSize: 12,
      color: themeColors.textMuted,
      fontWeight: '500',
    },
    lastMsg: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginTop: 2,
    },
    unreadMsg: {
      color: themeColors.text,
      fontWeight: '700',
    },
    unreadBadge: {
      backgroundColor: themeColors.badge,
      width: 22,
      height: 22,
      borderRadius: 11,
      justifyContent: 'center',
      alignItems: 'center',
    },
    unreadCount: {
      color: themeColors.white,
      fontSize: 11,
      fontWeight: 'bold',
    },
    actionPill: {
      borderRadius: Spacing.radiusFull,
      overflow: 'hidden',
      marginLeft: Spacing.xs,
    },
    actionGradient: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: Spacing.radiusFull,
      minWidth: 78,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionPillText: {
      fontSize: 13,
      color: themeColors.white,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: themeColors.inputBackground,
      margin: Spacing.screenPaddingHorizontal,
      paddingHorizontal: Spacing.lg,
      borderRadius: Spacing.radiusXl,
      height: 48,
      borderWidth: 1,
      borderColor: themeColors.glassBorder,
    },
    searchInput: {
      flex: 1,
      marginLeft: Spacing.md,
      fontSize: 15,
      color: themeColors.text,
    },
    emptyView: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: 60,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: themeColors.text,
      marginTop: Spacing.xl,
    },
    emptyDesc: {
      fontSize: 14,
      color: themeColors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 50,
      marginTop: Spacing.sm,
    },
  });
