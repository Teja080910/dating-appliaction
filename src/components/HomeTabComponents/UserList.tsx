import React, { useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import apiClient, { getAbsoluteUrl } from '../../api/apiClient';
import { useDiscovery } from '../../api/useDiscovery';
import AppContext from '../../context/CreateGlobalStateContext';
import UserCard from './UserCard';
import { getUserId } from '../../utils/sessionHelper';
import { getSavedSearchFilters } from '../../utils/types/AsyncStorage';
import { Colors, Spacing, useTheme } from '../../theme';
import { useResponsive } from '../../utils/responsive';


interface HomeUserListProps {
  filterByGender: string | null;
  mode?: 'online' | 'newest';
  filteredProfiles?: any[] | null;
  userLocation?: { latitude: number; longitude: number } | null;
}

const normalizeText = (value: unknown) => String(value || '').trim().toLowerCase();

const hasActiveSearchFilters = (saved: any): boolean => {
  if (!saved || typeof saved !== 'object') return false;
  return Boolean(
    saved.isFilterActive === true ||
    (saved.minAge !== undefined && (saved.minAge !== 18 || saved.maxAge !== 40)) ||
    (saved.minHeight !== undefined && (saved.minHeight !== 120 || saved.maxHeight !== 200)) ||
    (Array.isArray(saved.bodyType) && saved.bodyType.length > 0) ||
    (Array.isArray(saved.appearance) && saved.appearance.length > 0) ||
    (Array.isArray(saved.language) && saved.language.length > 0) ||
    (Array.isArray(saved.englishLevel) && saved.englishLevel.length > 0) ||
    (Array.isArray(saved.ethnicity) && saved.ethnicity.length > 0) ||
    (Array.isArray(saved.lookingFor) && saved.lookingFor.length > 0) ||
    saved.smoke !== undefined ||
    saved.drink !== undefined ||
    (saved.location && saved.location !== 'My current location' && saved.location !== 'Mumbai, India') ||
    saved.worldwide === true ||
    (saved.maxDistanceKm !== undefined && saved.maxDistanceKm < 50)
  );
};

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
      profile?.photos, item?.photos,
      profile?.photo, item?.photo,
    ]
      .map(extractFirstImagePath)
      .find(Boolean) || null;
  return imagePath ? getAbsoluteUrl(imagePath) : null;
};

const resolveProfileUserId = (item: any): string | number | null => {
  const ids = [
    item?.userId, item?.profile?.userId,
    item?.user?.userId, item?.profile?.user?.userId,
    item?.id, item?.user?.id, item?.profile?.user?.id,
  ];
  for (const id of ids) {
    if (id === null || id === undefined) continue;
    const normalized = String(id).trim();
    if (!normalized || normalized === '0' || normalized === 'null' || normalized === 'undefined') continue;
    if (/^[A-Za-z0-9_-]+$/.test(normalized) && /[A-Za-z]/.test(normalized)) return normalized;
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
  const gender = normalizeText(item?.profile?.gender || item?.gender);
  if (selectedGender === 'straight_man') return gender === 'man' || gender === 'male';
  // PRD FR-12 & BR-04: Men see women only. Browse grid defaults to women's profiles.
  return gender === 'woman' || gender === 'female';
};

const keepInvitableProfiles = (items: any[]) =>
  items.filter((item) => resolveProfileUserId(item));

const UserList = ({
  filterByGender,
  mode = 'online',
  filteredProfiles = null,
}: HomeUserListProps) => {
  const { filterUsers, searchUsers } = useDiscovery();
  const { width, columns, getCardWidth } = useResponsive();
  const {
    showMe,
    authUserId,
  } = useContext(AppContext);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
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
        setLoadingMore(false);
        // Men browsing always target women ('straight_woman') per PRD FR-12 / BR-04
        const selectedGender = filterByGender || 'straight_woman';
        let items: any[] = [];

        const resolvedUserId = resolvedBackendUserId || (await getUserId());
        const savedFilters = await getSavedSearchFilters(resolvedUserId);
        const hasFilters = hasActiveSearchFilters(savedFilters);

        try {
          if (hasFilters) {
            // Apply saved filters across both tabs:
            // "Active now" -> filters + onlyOnline: true & sortBy: 'active'
            // "Just joined" -> filters + onlyOnline: false & sortBy: 'createdAt'
            const searchPayload: Record<string, any> = {
              ...savedFilters,
              userId: resolvedUserId || undefined,
              gender: savedFilters?.gender || (selectedGender === 'straight_man' ? ['Male'] : ['Female']),
              onlyOnline: mode === 'online',
              sortBy: mode === 'online' ? 'active' : 'createdAt',
              page: 0,
              size: 20,
            };
            const searchRes = await filterUsersMutationRef.current(searchPayload);
            items = parseUserCollection(searchRes);
          } else if (filteredProfiles !== null && filteredProfiles.length > 0) {
            items = filteredProfiles;
          } else if (mode === 'online') {
            try {
              const res = await apiClient.get('/dashboard/online', {
                params: { page: 0, size: 20 },
              });
              items = parseUserCollection(res.data);
            } catch (onlineError) {
              console.log('[UserList] online failed → using online-only search');
              const searchRes = await searchUsersMutationRef.current({
                onlyOnline: true,
                sortBy: 'active',
              });
              items = parseUserCollection(searchRes);
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

        // Demo / fallback safeguard: if empty and not explicitly filtered, load from mock store
        if (!hasFilters && filteredProfiles === null && (!items || items.length === 0)) {
          try {
            const { mockStore } = require('../../mock/mockStore');
            items = await mockStore.getProfiles(selectedGender === 'straight_man' ? 'man' : 'woman');
          } catch {}
        }

        const genderMatched = items.filter((item) =>
          matchesGenderSelection(item, selectedGender) &&
          (mode !== 'online' || item?.online === true || item?.profile?.online === true)
        );
        const invitable = keepInvitableProfiles(genderMatched);
        const finalItems = resolvedBackendUserId
          ? invitable.filter((item) => {
              const itemUserId = String(resolveProfileUserId(item) || '');
              return itemUserId && itemUserId !== String(resolvedBackendUserId);
            })
          : invitable;

        if (isMounted) {
          setProfiles(finalItems);
          setPage(0);
          setHasMore(finalItems.length >= 10);
          setLoadingMore(false);
        }
      } catch (error) {
        console.warn('Home load failed:', error);
        if (isMounted) {
          setProfiles([]);
          setHasMore(false);
          setLoadingMore(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    };

    fetchMatches();
    return () => { isMounted = false; };
  }, [mode, filterByGender, showMe, resolvedBackendUserId, filteredProfiles]);

  const handleLoadMore = async () => {
    if (loading || loadingMore || !hasMore || profiles.length < 10) return;
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const selectedGender = filterByGender || 'straight_woman';
      const resolvedUserId = resolvedBackendUserId || (await getUserId());
      const savedFilters = await getSavedSearchFilters(resolvedUserId);
      const hasFilters = hasActiveSearchFilters(savedFilters);

      let newItems: any[] = [];
      if (hasFilters) {
        const searchPayload: Record<string, any> = {
          ...savedFilters,
          userId: resolvedUserId || undefined,
          gender: savedFilters?.gender || (selectedGender === 'straight_man' ? ['Male'] : ['Female']),
          onlyOnline: mode === 'online',
          sortBy: mode === 'online' ? 'active' : 'createdAt',
          page: nextPage,
          size: 10,
        };
        const searchRes = await filterUsersMutationRef.current(searchPayload);
        newItems = parseUserCollection(searchRes);
      } else {
        const endpoint = mode === 'online' ? '/dashboard/online' : '/dashboard/recent';
        const res = await apiClient.get(endpoint, {
          params: { page: nextPage, size: 10 },
        });
        newItems = parseUserCollection(res.data);
      }
      if (!newItems || newItems.length === 0) {
        setHasMore(false);
      } else {
        const selectedGender = filterByGender || 'straight_woman';
        const genderMatched = newItems.filter((item: any) =>
          matchesGenderSelection(item, selectedGender)
        );
        const invitable = keepInvitableProfiles(genderMatched);
        const finalItems = resolvedBackendUserId
          ? invitable.filter((item: any) => {
              const itemUserId = String(resolveProfileUserId(item) || '');
              return itemUserId && itemUserId !== String(resolvedBackendUserId);
            })
          : invitable;

        if (finalItems.length === 0) {
          setHasMore(false);
        } else {
          setProfiles((prev) => {
            const existingIds = new Set(prev.map((p) => String(resolveProfileUserId(p) || p.id)));
            const uniqueNew = finalItems.filter((p) => !existingIds.has(String(resolveProfileUserId(p) || p.id)));
            return [...prev, ...uniqueNew];
          });
          setPage(nextPage);
          if (newItems.length < 10 || finalItems.length < 10) {
            setHasMore(false);
          }
        }
      }
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const { themeColors } = useTheme();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  const screenPadding = Spacing.screenPaddingHorizontal * 2;
  const gap = 12;
  const cardWidth = getCardWidth(columns, screenPadding, gap);
  const cardHeight = Math.round(Math.min(Math.max(cardWidth * 1.34, 220), width >= 600 ? 360 : 340));

  return (
    <FlatList
      key={`userlist-cols-${columns}`}
      data={profiles}
      numColumns={columns}
      keyExtractor={(item, index) => item?.userId || item?.id?.toString() || index.toString()}
      columnWrapperStyle={columns > 1 ? styles.row : undefined}
      contentContainerStyle={[styles.container, { backgroundColor: themeColors.background }]}
      onEndReached={hasMore && profiles.length >= 10 ? handleLoadMore : null}
      onEndReachedThreshold={0.2}
      ListFooterComponent={
        loadingMore && hasMore && profiles.length >= 10 ? (
          <View style={{ paddingVertical: 16, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={themeColors.primary} />
          </View>
        ) : null
      }
      renderItem={({ item }) => {
        const profile = item?.profile || item;
        const rawName = String(profile?.name || profile?.displayName || item?.name || 'User');
        const cleanName = rawName.replace(/,\s*\d+$/, '').trim();
        const safeAge = profile?.age || item?.age || '24';
        return (
          <UserCard
            id={resolveProfileUserId(item) ?? item.id}
            name={cleanName}
            age={safeAge}
            image={resolveHomeCardImage(item)}
            distance={profile?.currentCity || profile?.city || 'Nearby'}
            isOnline={profile?.online === true}
            isNew={mode === 'newest'}
            profileData={item}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
          />
        );
      }}
      ListEmptyComponent={
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            No {mode === 'online' ? 'online' : 'new'} profiles found.
          </Text>
        </View>
      }
    />
  );
};

export default UserList;

const createStyles = (colors: any) =>
  StyleSheet.create({
    row: {
      justifyContent: 'flex-start',
      gap: 12,
      paddingHorizontal: Spacing.screenPaddingHorizontal,
    },
    container: {
      paddingTop: Spacing.md,
      paddingBottom: 100,
      backgroundColor: colors.background,
    },
    loader: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    emptyBox: {
      padding: Spacing.xl,
      alignItems: 'center',
    },
    emptyText: {
      color: colors.textMuted,
      fontWeight: '600',
      fontSize: 15,
    },
  });

