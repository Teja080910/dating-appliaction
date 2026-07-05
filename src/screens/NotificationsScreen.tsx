import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { notificationApi } from '../api/notificationApi';
import { AuthStorage } from '../api/authStorage';
import { Notification } from '../api/types';
import { colors, radius, shadow, typography } from '../constants/theme';

const extractList = (data: any): Notification[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (data.content && Array.isArray(data.content)) return data.content;
  return [];
};

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(false);
    try {
      const userIdNum = await AuthStorage.getUserId();
      if (!userIdNum) {
        setError(true);
        return;
      }
      const data = await notificationApi.getAll(userIdNum);
      setNotifications(extractList(data));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications(true);
  };

  const handlePress = async (item: Notification) => {
    if (item.readStatus) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, readStatus: true } : n))
    );
    try {
      await notificationApi.markRead(item.id);
    } catch {}
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[s.card, !item.readStatus && s.cardUnread]}
      onPress={() => handlePress(item)}
      activeOpacity={0.85}
    >
      <View style={[s.iconWrap, !item.readStatus && s.iconWrapUnread]}>
        <Icon name="bell" solid size={15} color={!item.readStatus ? colors.surface : colors.primary} />
      </View>
      <View style={s.cardBody}>
        <Text style={s.message}>{item.message}</Text>
        {item.createdAt ? (
          <Text style={s.timestamp}>{new Date(item.createdAt).toLocaleString()}</Text>
        ) : null}
      </View>
      {!item.readStatus ? <View style={s.dot} /> : null}
    </TouchableOpacity>
  );

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
        <Text style={s.title}>Notifications</Text>
      </View>

      {error ? (
        <View style={s.centered}>
          <Text style={s.emptyText}>Couldn't load notifications due to a server issue. Please try again later.</Text>
        </View>
      ) : notifications.length > 0 ? (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={s.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      ) : (
        <View style={s.centered}>
          <Text style={s.emptyText}>No notifications yet</Text>
        </View>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceAlt },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  title: { ...typography.display, color: colors.ink },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyText: { fontSize: 16, color: colors.inkMuted, textAlign: 'center', paddingHorizontal: 24 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.soft,
  },
  cardUnread: { backgroundColor: colors.primaryLight, borderColor: colors.primaryLight },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconWrapUnread: { backgroundColor: colors.primary, borderColor: colors.primary },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginLeft: 8,
    marginTop: 4,
  },
  cardBody: { flex: 1 },
  message: { ...typography.body, color: colors.ink },
  timestamp: { ...typography.caption, color: colors.inkMuted, marginTop: 6 },
});

export default NotificationsScreen;
