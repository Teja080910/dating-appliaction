import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { connectionsApi } from '../../api/connectionsApi';
import { notificationApi } from '../../api/notificationApi';
import AuthImage from '../../components/AuthImage';
import { resolveImageUri } from '../../utils/imageUtils';
import { AuthStorage } from '../../api/authStorage';
import { ConnectionRequest } from '../../api/types';
import { colors, radius, shadow, typography } from '../../constants/theme';

type TabKey = 'pending' | 'accepted' | 'declined';

const PAGE_SIZE = 20;

const extractList = (data: any): ConnectionRequest[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (data.content && Array.isArray(data.content)) return data.content;
  if (data.requests && Array.isArray(data.requests)) return data.requests;
  return [];
};

export default function InvitationsScreen() {
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [userGender, setUserGender] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  const [allPending, setAllPending] = useState<ConnectionRequest[]>([]);
  const [allAccepted, setAllAccepted] = useState<ConnectionRequest[]>([]);
  const [allDeclined, setAllDeclined] = useState<ConnectionRequest[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getDataForTab = useCallback((): ConnectionRequest[] => {
    const source = activeTab === 'pending' ? allPending : activeTab === 'accepted' ? allAccepted : allDeclined;
    if (!searchQuery.trim()) return source;
    const q = searchQuery.toLowerCase();
    return source.filter((item) => {
      const isReceived = item.receiver?.userId === myUserId || item.receiver?.id === Number(myUserId);
      const otherUser = isReceived ? item.sender : item.receiver;
      const name = (otherUser?.name || otherUser?.profile?.displayName || otherUser?.profile?.name || '').toLowerCase();
      return name.includes(q);
    });
  }, [activeTab, allPending, allAccepted, allDeclined, searchQuery, myUserId]);

  const fetchAll = useCallback(async () => {
    try {
      setLoadError(false);
      const userData = await AuthStorage.getUser();
      const id = userData?.userId || (await AuthStorage.getUserIdStr());
      if (!id) return;
      setMyUserId(id);

      // /profile/me never returns gender (confirmed against the live
      // backend) — read it from the cached login/register payload instead,
      // which does return it top-level.
      setUserGender(userData?.gender || '');

      // NOTE: do not swallow individual failures here — /connections/sent and
      // /connections/received are known to fail (malformed JSON) whenever the
      // backend's circular User<->Profile serialization bug is triggered by
      // real data. Letting the error propagate to the outer catch surfaces a
      // clear "couldn't load" state instead of silently showing an empty
      // list, which would look like "no pending requests" even when a real
      // request exists.
      const [sentRes, receivedRes] = await Promise.all([
        connectionsApi.getSentRequests(id),
        connectionsApi.getReceivedRequests(id),
      ]);

      const sent = extractList(sentRes);
      const received = extractList(receivedRes);

      const seen = new Set<number>();
      const all: ConnectionRequest[] = [];
      [...sent, ...received].forEach((item) => {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          all.push(item);
        }
      });

      const pending = all.filter((r) => r.status === 'PENDING');
      const accepted = all.filter((r) => r.status === 'ACCEPTED');
      const declined = all.filter((r) => r.status === 'DECLINED' || r.status === 'CANCELLED');

      setAllPending(pending);
      setAllAccepted(accepted);
      setAllDeclined(declined);
      setPage(0);
      setHasMore(true);
    } catch {
      setLoadError(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchAll().finally(() => setLoading(false));
      pollingRef.current = setInterval(() => {
        fetchAll();
      }, 15000);
      return () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
      };
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    const data = getDataForTab();
    if (data.length <= (page + 1) * PAGE_SIZE) {
      setHasMore(false);
      return;
    }
    setLoadingMore(true);
    setPage((p) => p + 1);
    setLoadingMore(false);
  };

  const handleAccept = async (requestId: number) => {
    try {
      if (!myUserId) return;
      await connectionsApi.acceptRequest({ requestId: String(requestId), userId: myUserId });
      try {
        await notificationApi.push({ userId: myUserId, message: 'Your request has been accepted!' });
      } catch {}
      Alert.alert('Accepted', 'You have accepted the request');
      await fetchAll();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to accept request');
    }
  };

  const handleDecline = async (requestId: number) => {
    try {
      if (!myUserId) return;
      await connectionsApi.declineRequest({ requestId: String(requestId), userId: myUserId });
      Alert.alert('Declined', 'Request has been declined');
      await fetchAll();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to decline request');
    }
  };

  const handleCancel = async (requestId: number) => {
    try {
      if (!myUserId) return;
      await connectionsApi.cancelRequest({ requestId: String(requestId), userId: myUserId });
      Alert.alert('Cancelled', 'Request has been cancelled');
      await fetchAll();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to cancel request');
    }
  };

  const isFemale = userGender === 'female';
  const isMale = userGender === 'male';

  const tabs: { key: TabKey; label: string; count: number }[] = isFemale
    ? [
        { key: 'pending', label: 'Incoming', count: allPending.filter((r) => r.receiver?.userId === myUserId || r.receiver?.id === Number(myUserId)).length },
        { key: 'accepted', label: 'Accepted', count: allAccepted.length },
        { key: 'declined', label: 'Declined', count: allDeclined.length },
      ]
    : [
        { key: 'pending', label: 'Pending', count: allPending.filter((r) => r.sender?.userId === myUserId || r.sender?.id === Number(myUserId)).length },
        { key: 'accepted', label: 'Accepted', count: allAccepted.length },
        { key: 'declined', label: 'Declined', count: allDeclined.length },
      ];

  const displayData = getDataForTab();
  const paginatedData = displayData.slice(0, (page + 1) * PAGE_SIZE);

  const renderItem = ({ item }: { item: ConnectionRequest }) => {
    const isReceived = item.receiver?.userId === myUserId || item.receiver?.id === Number(myUserId);
    const otherUser = isReceived ? item.sender : item.receiver;
    const otherName = otherUser?.name || otherUser?.profile?.displayName || otherUser?.profile?.name || otherUser?.userId || '';
    const otherImage = otherUser?.profile?.profileImageUrl || '';

    const statusStyle =
      item.status === 'ACCEPTED' ? s.statusAccepted :
      item.status === 'PENDING' ? s.statusPending : s.statusDeclined;
    const statusDotStyle =
      item.status === 'ACCEPTED' ? s.dotAccepted :
      item.status === 'PENDING' ? s.dotPending : s.dotDeclined;

    return (
      <View style={s.card}>
        <View style={s.cardRow}>
          {otherImage ? (
            <AuthImage uri={resolveImageUri(otherImage)} style={s.avatar} />
          ) : (
            <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={[s.avatar, s.avatarPlaceholder]}>
              <Text style={s.avatarText}>{otherName ? otherName.charAt(0).toUpperCase() : '?'}</Text>
            </LinearGradient>
          )}
          <View style={s.cardInfo}>
            <Text style={s.cardName}>{otherName || 'Unknown'}</Text>
            <View style={[s.statusPill, statusStyle]}>
              <View style={[s.statusDot, statusDotStyle]} />
              <Text style={s.cardStatus}>{item.status}</Text>
            </View>
          </View>
        </View>
        <View style={s.actionRow}>
          {isFemale && isReceived && item.status === 'PENDING' && (
            <>
              <TouchableOpacity style={[s.actionBtn, s.acceptBtn]} onPress={() => handleAccept(item.id)}>
                <Text style={s.actionBtnText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.actionBtn, s.declineBtn]} onPress={() => handleDecline(item.id)}>
                <Text style={s.actionBtnText}>Decline</Text>
              </TouchableOpacity>
            </>
          )}
          {isMale && !isReceived && item.status === 'PENDING' && (
            <TouchableOpacity style={[s.actionBtn, s.cancelBtn]} onPress={() => handleCancel(item.id)}>
              <Text style={s.actionBtnText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[s.container, s.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Messages</Text>
      </View>

      <View style={s.searchBar}>
        <TextInput
          style={s.searchInput}
          placeholder="Search by name..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={s.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tab, activeTab === tab.key && s.tabActive]}
            onPress={() => { setActiveTab(tab.key); setPage(0); }}
          >
            <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>
              {tab.label} ({tab.count})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {paginatedData.length > 0 ? (
        <FlatList
          data={paginatedData}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={s.listContent}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color={colors.primary} /> : null}
        />
      ) : loadError ? (
        <View style={s.centered}>
          <Text style={s.emptyText}>Couldn't load requests due to a server issue. Your requests may still exist — please try again later.</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => { setLoading(true); fetchAll().finally(() => setLoading(false)); }}>
            <Text style={s.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.centered}>
          <Text style={s.emptyText}>No {tabs.find((t) => t.key === activeTab)?.label.toLowerCase()} requests</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  title: { ...typography.display, color: colors.ink },
  searchBar: { paddingHorizontal: 24, paddingBottom: 12 },
  searchInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabRow: { flexDirection: 'row', paddingHorizontal: 24, marginBottom: 16, gap: 8 },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: 14, color: colors.inkMuted, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  listContent: { paddingHorizontal: 24, paddingBottom: 100 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.soft,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  cardInfo: { marginLeft: 14, flex: 1 },
  cardName: { ...typography.heading, color: colors.ink },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radius.pill,
    gap: 5,
  },
  statusPending: { backgroundColor: colors.warningLight },
  statusAccepted: { backgroundColor: colors.successLight },
  statusDeclined: { backgroundColor: colors.dangerLight },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  dotPending: { backgroundColor: colors.warning },
  dotAccepted: { backgroundColor: colors.success },
  dotDeclined: { backgroundColor: colors.danger },
  cardStatus: { fontSize: 11, color: colors.inkMuted, fontWeight: '700', textTransform: 'capitalize' },
  actionRow: { flexDirection: 'row', marginTop: 14, gap: 10 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.md, alignItems: 'center' },
  acceptBtn: { backgroundColor: colors.success },
  declineBtn: { backgroundColor: colors.danger },
  cancelBtn: { backgroundColor: colors.warning },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  emptyText: { fontSize: 16, color: '#999', textAlign: 'center', paddingHorizontal: 24 },
  retryBtn: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  retryBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
