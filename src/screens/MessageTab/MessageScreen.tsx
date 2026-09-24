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
import { Colors, Spacing, Shadows, Typography } from '../../theme';
import { useAlert } from '../../components/AlertModal';

export default function MessageScreen() {
  const { alert, AlertComponent } = useAlert();
  const navigation = useNavigation<any>();
  const [userId, setUserId] = useState<string | null>(null);
  const [activeMainTab, setActiveMainTab] = useState<'Invitations' | 'Messages'>('Invitations');
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
      profile?.imageUrl,
      targetUser?.imageUrl,
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
    const trimmed = String(raw).trim();
    return trimmed || 'User';
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
      lastMsg: status === 'ACCEPTED' ? 'You are connected. Start the conversation.' : `Connection status: ${status}`,
      time: formatInviteTime(request?.updatedAt || request?.createdAt),
      unread: 0,
      image: resolveUserImage(targetUser, profile),
      online: profile?.online ?? targetUser?.online ?? false,
    };
  }, [userId]);

  const { setOppositeGender } = useContext(AppContext);

  const sentInvites = useMemo(() => {
    const items = Array.isArray(connection.sentList.data) ? connection.sentList.data : [];
    return items.map((item: any) => normalizeInvite(item, 'sent'));
  }, [connection.sentList.data, normalizeInvite]);

  const receivedInvites = useMemo(() => {
    const items = Array.isArray(connection.receivedList.data) ? connection.receivedList.data : [];
    return items.map((item: any) => normalizeInvite(item, 'received'));
  }, [connection.receivedList.data, normalizeInvite]);

  const connectionChats = useMemo(() => {
    const items = Array.isArray(connection.connectionList.data) ? connection.connectionList.data : [];
    return items.map((item: any) => normalizeChat(item));
  }, [connection.connectionList.data, normalizeChat]);

  const sentLoading = Boolean(userId) && (connection.sentList.isLoading || connection.sentList.isRefetching);
  const receivedLoading = Boolean(userId) && (connection.receivedList.isLoading || connection.receivedList.isRefetching);
  const messagesLoading = Boolean(userId) && (connection.connectionList.isLoading || connection.connectionList.isRefetching);

  const handleRecall = (id: string | number) => {
    connection.cancel.mutate(Number(id), {
      onSuccess: () => {
        void connection.sentList.refetch();
        Toast.show({ type: 'success', text1: 'Invitation Recalled', text2: 'The invitation has been cancelled.' });
      },
      onError: () => { alert('Error', 'Failed to recall invitation.'); },
    });
  };

  const handleAccept = (item: any) => {
    connection.accept.mutate(Number(item.requestId || item.id), {
      onSuccess: () => {
        void connection.receivedList.refetch();
        void connection.connectionList.refetch();
        Toast.show({ type: 'success', text1: 'Invitation Accepted!', text2: `You can now chat with ${item.name || item.username || 'them'}.` });
      },
      onError: () => { alert('Error', 'Failed to accept invitation.'); },
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
          <Icon name="clock-check-outline" size={13} color={Colors.secondary} />
          <Text style={styles.itemStatusLabel}>
            {activeInviteTab === 'Sent' ? (item.status || 'PENDING') : 'Invited you'}
          </Text>
          {item.time ? (
            <>
              <Text style={styles.dotSeparator}>•</Text>
              <Text style={styles.itemDateText}>{item.time}</Text>
            </>
          ) : null}
        </View>
      </View>
      <TouchableOpacity
        style={styles.actionPill}
        activeOpacity={0.8}
        onPress={() => activeInviteTab === 'Sent' ? handleRecall(item.requestId || item.id) : handleAccept(item)}
      >
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.actionGradient}
        >
          <Text style={styles.actionPillText}>{activeInviteTab === 'Sent' ? 'Recall' : 'Accept'}</Text>
        </LinearGradient>
      </TouchableOpacity>
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
          style={[styles.navBtn, activeMainTab === 'Invitations' && styles.activeNavBtn]}
          onPress={() => setActiveMainTab('Invitations')}
        >
          <Icon name="email-outline" size={24} color={activeMainTab === 'Invitations' ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.navText, activeMainTab === 'Invitations' && styles.activeNavText]}>Invitations</Text>
          {activeMainTab === 'Invitations' && <View style={styles.navIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtn, activeMainTab === 'Messages' && styles.activeNavBtn]}
          onPress={() => requireSubscription(() => setActiveMainTab('Messages'))}
        >
          <Icon name="chat-processing-outline" size={24} color={activeMainTab === 'Messages' ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.navText, activeMainTab === 'Messages' && styles.activeNavText]}>Messages</Text>
          {activeMainTab === 'Messages' && <View style={styles.navIndicator} />}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeMainTab === 'Invitations' ? (
          <View style={{ flex: 1 }}>
            <View style={styles.subTabs}>
              <TouchableOpacity onPress={() => setActiveInviteTab('Sent')} style={[styles.subTab, activeInviteTab === 'Sent' && styles.activeSubTab]}>
                <Text style={[styles.subTabText, activeInviteTab === 'Sent' && styles.activeSubTabText]}>Sent ({sentInvites?.length || 0})</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveInviteTab('Received')} style={[styles.subTab, activeInviteTab === 'Received' && styles.activeSubTab]}>
                <Text style={[styles.subTabText, activeInviteTab === 'Received' && styles.activeSubTabText]}>Received ({receivedInvites?.length || 0})</Text>
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
                <Text style={styles.emptyTitle}>No invitations yet</Text>
                <Text style={styles.emptyDesc}>Invite people you like to start a conversation!</Text>
                <View style={{ width: '80%', marginTop: Spacing.xl }}><InviteButton /></View>
              </View>
            )}
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <View style={styles.searchContainer}>
              <Icon name="magnify" size={20} color={Colors.textMuted} />
              <TextInput placeholder="Search messages..." style={styles.searchInput} placeholderTextColor={Colors.textMuted} value={searchQuery} onChangeText={setSearchQuery} />
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
                <Text style={styles.emptyTitle}>No messages yet</Text>
                <Text style={styles.emptyDesc}>Accepted connections will appear here for quick access.</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mainNav: {
    flexDirection: 'row',
    height: 64,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: Colors.surface,
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
    color: Colors.textMuted,
  },
  activeNavText: {
    color: Colors.text,
  },
  navIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '50%',
    height: 3,
    backgroundColor: Colors.primary,
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
    borderBottomColor: Colors.divider,
  },
  subTab: {
    paddingBottom: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeSubTab: {
    borderBottomColor: Colors.primary,
  },
  subTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  activeSubTabText: {
    color: Colors.text,
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
    borderBottomColor: Colors.divider,
  },
  avatarBox: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.glassBorder,
  },
  placeholderAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.glassBorder,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.online,
    borderWidth: 2,
    borderColor: Colors.background,
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
    color: Colors.text,
    marginBottom: 2,
  },
  itemTime: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  itemStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemStatusLabel: {
    fontSize: 13,
    color: Colors.secondary,
    fontWeight: '600',
  },
  dotSeparator: {
    fontSize: 12,
    color: Colors.textMuted,
    marginHorizontal: 3,
  },
  itemDateText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  lastMsg: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  unreadMsg: {
    color: Colors.text,
    fontWeight: '700',
  },
  unreadBadge: {
    backgroundColor: Colors.badge,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCount: {
    color: Colors.white,
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
    color: Colors.white,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    margin: Spacing.screenPaddingHorizontal,
    paddingHorizontal: Spacing.lg,
    borderRadius: Spacing.radiusXl,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.md,
    fontSize: 15,
    color: Colors.text,
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
    color: Colors.text,
    marginTop: Spacing.xl,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 50,
    marginTop: Spacing.sm,
  },
});
