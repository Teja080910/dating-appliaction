import React, { useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import apiClient, { getAbsoluteUrl } from '../../api/apiClient';
import { useDiscovery } from '../../api/useDiscovery';
import AppContext from '../../context/CreateGlobalStateContext';
import UserCard from './UserCard';
import { getUserId } from '../../utils/sessionHelper';
import { Colors, Spacing, Typography } from '../../theme';

interface HomeUserListProps {
  filterByGender: string | null;
  mode?: 'online' | 'newest';
  userLocation?: { latitude: number; longitude: number } | null;
}

const normalizeText = (value: unknown) => String(value || '').trim().toLowerCase();

const extractFirstImagePath = (value: unknown): string | null => {
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

const resolveHomeCardImage = (item: any) => {
  const profile = item?.profile || item;
  const imagePath =
    [
      profile?.profileImageUrl, item?.profileImageUrl,
      profile?.imageUrl, item?.imageUrl,
      profile?.images, item?.images,
    ]
      .map(extractFirstImagePath)
      .find(Boolean) || null;
  return imagePath ? getAbsoluteUrl(imagePath) : null;
};

const resolveProfileUserId = (item: any): string | number | null => {
  const ids = [
    item?.id, item?.userId, item?.profile?.userId,
    item?.user?.id, item?.user?.userId,
    item?.profile?.user?.id, item?.profile?.user?.userId,
  ];
  for (const id of ids) {
    // if (id === null || id === undefined) continue;
    // const normalized = String(id).trim();
    // if (!normalized || normalized === '0' || normalized === 'null' || normalized === 'undefined') continue;
    // // Alphanumeric backend IDs like SA1000, US1025
    // if (/^[A-Za-z]+\d+$/.test(normalized)) return normalized;
    // Pure numeric IDs
    const num = Number(id);
    if (Number.isFinite(num) && num > 0) return num;
  }
  return null;
};

const parseUserCollection = (data: any) =>
  (Array.isArray(data?.content) ? data.content : null) ||
  (Array.isArray(data?.data) ? data.data : null) ||
  (Array.isArray(data) ? data : []);

const matchesGenderSelection = (item: any, selectedGender: string | null) => {
  if (!selectedGender || selectedGender === 'lgbtqia') return true;
  const gender = normalizeText(item?.profile?.gender || item?.gender);
  if (selectedGender === 'straight_man') return gender === 'woman' || gender === 'female';
  if (selectedGender === 'straight_woman') return gender === 'man' || gender === 'male';
  return true;
};

const keepInvitableProfiles = (items: any[]) =>
  items.filter((item) => resolveProfileUserId(item));

const UserList = ({ filterByGender, mode = 'online' }: HomeUserListProps) => {
  const { filterUsers, searchUsers } = useDiscovery();
  const {
    showMe,
    authUserId,
  } = useContext(AppContext);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvedBackendUserId, setResolvedBackendUserId] = useState<string | null>(null);

  const filterUsersMutationRef = useRef(filterUsers.mutateAsync);
  const searchUsersMutationRef = useRef(searchUsers.mutateAsync);

  useEffect(() => {
    filterUsersMutationRef.current = filterUsers.mutateAsync;
    searchUsersMutationRef.current = searchUsers.mutateAsync;
  }, [filterUsers.mutateAsync, searchUsers.mutateAsync]);

  useEffect(() => {
    let isMounted = true;
    getUserId().then((id) => { if (isMounted) setResolvedBackendUserId(id); });
    return () => { isMounted = false; };
  }, [authUserId]);

  useEffect(() => {
    let isMounted = true;
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const selectedGender = showMe || filterByGender;
        let items: any[] = [];

        try {
          if (mode === 'online') {
            try {
              const res = await apiClient.get('/dashboard/online', {
                params: { page: 0, size: 20 },
              });
              items = parseUserCollection(res.data);
            } catch (onlineError) {
              console.log('[UserList] online failed → trying recent');
              try {
                const res = await apiClient.get('/dashboard/recent', {
                  params: { page: 0, size: 20 },
                });
                items = parseUserCollection(res.data);
                items = items.filter((item) => item?.profile?.online === true);
              } catch (recentError) {
                console.log('[UserList] recent also failed → using search');
                const searchRes = await searchUsersMutationRef.current({ sortBy: 'active' });
                items = parseUserCollection(searchRes);
              }
            }
          } else {
            try {
              const res = await apiClient.get('/dashboard/recent', {
                params: { page: 0, size: 20 },
              });
              items = parseUserCollection(res.data);
            } catch (recentError) {
              console.log('[UserList] recent failed → using search');
              const searchRes = await searchUsersMutationRef.current({ sortBy: 'recent' });
              items = parseUserCollection(searchRes);
            }
          }
        } catch (err) {
          console.warn('[UserList] All APIs failed');
          items = [];
        }

        const genderMatched = items.filter((item) =>
          matchesGenderSelection(item, selectedGender)
        );
        let finalItems = keepInvitableProfiles(genderMatched);

        if (isMounted) setProfiles(finalItems);
      } catch (error) {
        console.warn('Home load failed:', error);
        if (isMounted) setProfiles([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMatches();
    return () => { isMounted = false; };
  }, [mode, filterByGender, showMe, resolvedBackendUserId]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={profiles}
      numColumns={2}
      keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.container}
      renderItem={({ item }) => {
        const profile = item?.profile || item;
        return (
          <UserCard
            id={resolveProfileUserId(item) ?? item.id}
            name={profile?.displayName || item?.name || 'User'}
            age={profile?.age || 'N/A'}
            image={resolveHomeCardImage(item)}
            distance={profile?.currentCity || 'Nearby'}
            isOnline={profile?.online === true}
            isNew={false}
          />
        );
      }}
      ListEmptyComponent={
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            No {mode === 'online' ? 'online' : 'new'} users found.
          </Text>
        </View>
      }
    />
  );
};

export default UserList;

const styles = StyleSheet.create({
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPaddingHorizontal,
  },
  container: {
    paddingTop: Spacing.md,
    paddingBottom: 100,
    backgroundColor: Colors.background,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  emptyBox: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontWeight: '600',
    fontSize: 15,
  },
});
