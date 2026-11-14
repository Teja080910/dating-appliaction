import React, { useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import apiClient, { getAbsoluteUrl } from '../../api/apiClient';
import { useDiscovery } from '../../api/useDiscovery';
import AppContext from '../../context/CreateGlobalStateContext';
import UserCard from './UserCard';
import { getUserId } from '../../utils/sessionHelper';
import { getSavedSearchFilters, getLocalBlockedUsers } from '../../utils/types/AsyncStorage';
import { Colors, Spacing, useTheme } from '../../theme';
import { useResponsive } from '../../utils/responsive';
import { resolveProfileDistance, filterByRadius } from '../../utils/distanceHelper';
import { t, useTranslation } from '../../i18n';


interface HomeUserListProps {
  filterByGender: string | null;
  mode?: 'online' | 'newest';
  filteredProfiles?: any[] | null;
  userLocation?: { latitude: number; longitude: number } | null;
}

const normalizeText = (value: unknown) => String(value || '').trim().toLowerCase();

const hasActiveSearchFilters = (saved: any): boolean => {
  if (!saved || typeof saved !== 'object') return false;
  if (saved.isFilterActive === false) return false;
  return Boolean(
    saved.showMe === 'straight_man' ||
    saved.showMe === 'both' ||
    (Array.isArray(saved.gender) && (saved.gender.includes(t('home.userlist.male')) || saved.gender.length > 1)) ||
    (saved.minAge !== undefined && (saved.minAge > 18 || saved.maxAge < 40)) ||
    (saved.minHeight !== undefined && (saved.minHeight > 120 || saved.maxHeight < 200)) ||
    (Array.isArray(saved.bodyType) && saved.bodyType.length > 0) ||
    (Array.isArray(saved.appearance) && saved.appearance.length > 0) ||
    (Array.isArray(saved.language) && saved.language.length > 0) ||
    (Array.isArray(saved.englishLevel) && saved.englishLevel.length > 0) ||
    (Array.isArray(saved.ethnicity) && saved.ethnicity.length > 0) ||
    (Array.isArray(saved.lookingFor) && saved.lookingFor.length > 0) ||
    (saved.smoke !== undefined && saved.smoke !== null && saved.smoke !== '') ||
    (saved.drink !== undefined && saved.drink !== null && saved.drink !== '') ||
    (saved.location &&
      saved.location.trim() !== '' &&
      saved.location !== t('search.location.my_current_location') &&
      saved.location !== 'Mumbai, India') ||
    saved.worldwide === true ||
    saved.onlyOnline === true ||
    (saved.worldwide !== true && (
      (saved.maxDistanceKm !== undefined && saved.maxDistanceKm !== 50) ||
      (saved.searchRadius !== undefined && saved.searchRadius !== 50) ||
      (saved.radius !== undefined && saved.radius !== 50) ||
      Boolean(saved.hasExplicitDistance)
    ))
  );
};

export const matchesSearchFilters = (
  item: any,
  savedFilters: any
): boolean => {
  if (!item || !savedFilters || savedFilters.isFilterActive === false) return true;
  const p = item?.profile || item;

  // 1. Age
  const pAge = Number(p.age ?? item.age ?? 24);
  if (Number.isFinite(Number(savedFilters.minAge)) && pAge < Number(savedFilters.minAge)) return false;
  if (Number.isFinite(Number(savedFilters.maxAge)) && pAge > Number(savedFilters.maxAge)) return false;

  // 2. Height
  const pHeight = Number(p.height ?? item.height);
  if (Number.isFinite(pHeight) && pHeight > 0) {
    if (Number.isFinite(Number(savedFilters.minHeight)) && pHeight < Number(savedFilters.minHeight)) return false;
    if (Number.isFinite(Number(savedFilters.maxHeight)) && pHeight > Number(savedFilters.maxHeight)) return false;
  }

  // 3. Body Type
  if (Array.isArray(savedFilters.bodyType) && savedFilters.bodyType.length > 0) {
    const rawBt = String(p.bodyType ?? item.bodyType ?? '').toLowerCase().trim();
    if (rawBt) {
      const match = savedFilters.bodyType.some((bt: string) => {
        const target = String(bt).toLowerCase().trim();
        return rawBt.includes(target) || target.includes(rawBt);
      });
      if (!match) return false;
    }
  }

  // 4. Appearance
  if (Array.isArray(savedFilters.appearance) && savedFilters.appearance.length > 0) {
    const rawApp = String(p.appearance ?? item.appearance ?? '').toLowerCase().trim();
    if (rawApp) {
      const match = savedFilters.appearance.some((app: string) => {
        const target = String(app).toLowerCase().trim();
        return rawApp.includes(target) || target.includes(rawApp);
      });
      if (!match) return false;
    }
  }

  // 5. Language
  if (Array.isArray(savedFilters.language) && savedFilters.language.length > 0) {
    const pLang = String(p.language ?? item.language ?? '').toLowerCase();
    const pLangs = Array.isArray(p.languages ?? item.languages)
      ? (p.languages ?? item.languages).map((l: any) => String(l).toLowerCase())
      : [];
    const match = savedFilters.language.some((lang: string) => {
      const target = String(lang).toLowerCase().trim();
      return pLang.includes(target) || pLangs.some((l: string) => l.includes(target));
    });
    if (!match && (pLang || pLangs.length > 0)) return false;
  }

  // 6. English Level
  if (Array.isArray(savedFilters.englishLevel) && savedFilters.englishLevel.length > 0) {
    const rawLvl = String(p.englishLevel ?? item.englishLevel ?? '').toLowerCase().trim();
    if (rawLvl) {
      const match = savedFilters.englishLevel.some((lvl: string) => {
        const target = String(lvl).toLowerCase().trim();
        return rawLvl.includes(target) || target.includes(rawLvl);
      });
      if (!match) return false;
    }
  }

  // 7. Ethnicity
  if (Array.isArray(savedFilters.ethnicity) && savedFilters.ethnicity.length > 0) {
    const rawEth = String(p.ethnicity ?? item.ethnicity ?? '').toLowerCase().trim();
    if (rawEth) {
      const match = savedFilters.ethnicity.some((eth: string) => {
        const target = String(eth).toLowerCase().trim();
        return rawEth.includes(target) || target.includes(rawEth);
      });
      if (!match) return false;
    }
  }

  // 8. Looking For
  if (Array.isArray(savedFilters.lookingFor) && savedFilters.lookingFor.length > 0) {
    const rawLf = String(p.lookingFor ?? item.lookingFor ?? '').toLowerCase().trim();
    if (rawLf) {
      const match = savedFilters.lookingFor.some((lf: string) => {
        const target = String(lf).toLowerCase().trim();
        return rawLf.includes(target) || target.includes(rawLf);
      });
      if (!match) return false;
    }
  }

  // 9. Smoke
  if (savedFilters.smoke !== undefined && savedFilters.smoke !== null && savedFilters.smoke !== '') {
    const rawSmoke = String(p.smoke ?? item.smoke ?? '').toLowerCase().trim();
    const filterSmoke = String(savedFilters.smoke).toLowerCase().trim();
    if (rawSmoke) {
      if (filterSmoke === 'no') {
        if (!['no', 'false', '0', 'never', 'non-smoker', 'non smoker'].includes(rawSmoke)) return false;
      } else if (filterSmoke === 'yes') {
        if (!['yes', 'true', '1', 'smoker'].includes(rawSmoke)) return false;
      } else if (filterSmoke === 'sometimes') {
        if (!['sometimes', 'occasionally'].includes(rawSmoke)) return false;
      }
    }
  }

  // 10. Drink
  if (savedFilters.drink !== undefined && savedFilters.drink !== null && savedFilters.drink !== '') {
    const rawDrink = String(p.drink ?? item.drink ?? '').toLowerCase().trim();
    const filterDrink = String(savedFilters.drink).toLowerCase().trim();
    if (rawDrink) {
      if (filterDrink === 'no') {
        if (!['no', 'false', '0', 'never', 'non-drinker', 'non drinker'].includes(rawDrink)) return false;
      } else if (filterDrink === 'yes') {
        if (!['yes', 'true', '1', 'regularly', 'socially', 'sometimes'].includes(rawDrink)) return false;
      } else if (filterDrink === 'sometimes') {
        if (!['sometimes', 'socially', 'occasionally', 'yes'].includes(rawDrink)) return false;
      }
    }
  }

  // 11. Online only
  if (savedFilters.onlyOnline) {
    const isOnline = Boolean(p.online ?? item.online);
    if (!isOnline) return false;
  }

  return true;
};

const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
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
    item?.ID, item?.user?.ID,
    item?.email, item?.user?.email, item?.profile?.email,
    item?.name,
  ];
  for (const id of ids) {
    if (id === null || id === undefined) continue;
    const normalized = String(id).trim();
    if (!normalized || normalized === '0' || normalized === 'null' || normalized === 'undefined') continue;
    if (/^[A-Za-z0-9_-]+$/.test(normalized) && /[A-Za-z]/.test(normalized)) return normalized;
    const num = Number(id);
    if (Number.isFinite(num) && num > 0) return num;
    return normalized;
  }
  return null;
};

const parseUserCollection = (data: any) =>
  (Array.isArray(data?.content) ? data.content : null) ||
  (Array.isArray(data?.data) ? data.data : null) ||
  (Array.isArray(data?.users) ? data.users : null) ||
  (Array.isArray(data?.profiles) ? data.profiles : null) ||
  (Array.isArray(data) ? data : []);

export const isFemaleGenderValue = (val: string) => {
  const s = String(val || '').toLowerCase().trim();
  return (
    s === 'f' ||
    s === 'female' ||
    s === 'woman' ||
    s === 'straight_woman' ||
    s.startsWith('f') ||
    s.includes('female') ||
    s.includes('woman')
  );
};

export const isMaleGenderValue = (val: string) => {
  const s = String(val || '').toLowerCase().trim();
  return (
    s === 'm' ||
    s === 'male' ||
    s === 'man' ||
    s === 'straight_man' ||
    (s.startsWith('m') && !s.includes('female')) ||
    (s.includes('male') && !s.includes('female')) ||
    (s.includes('man') && !s.includes('woman'))
  );
};

const matchesGenderSelection = (
  item: any,
  selectedGender: string | null,
  activeGenders?: string[] | null
) => {
  const rawGender =
    item?.profile?.gender ||
    item?.gender ||
    item?.user?.gender ||
    item?.genderOrientation?.gender ||
    item?.profile?.genderOrientation?.gender ||
    item?.sex ||
    item?.userGender ||
    '';
  const gender = normalizeText(rawGender);

  // If gender is completely empty/unspecified on a real DB account, keep it
  if (!gender) return true;

  const isMan = isMaleGenderValue(gender);
  const isWoman = isFemaleGenderValue(gender);

  if (activeGenders && activeGenders.length > 0) {
    const wantsMen = activeGenders.some((g) => isMaleGenderValue(g) || String(g).toLowerCase() === 'both');
    const wantsWomen = activeGenders.some((g) => isFemaleGenderValue(g) || String(g).toLowerCase() === 'both');
    if (wantsMen && wantsWomen) return isMan || isWoman;
    if (wantsMen) return isMan;
    if (wantsWomen) return isWoman;
  }

  if (selectedGender === 'both') return isMan || isWoman;
  if (selectedGender === 'straight_man') return isMan;
  return isWoman;
};

const keepInvitableProfiles = (items: any[]) =>
  items.filter((item) => {
    const uid = resolveProfileUserId(item);
    if (!uid) return false;
    const rawAge = item?.age ?? item?.profile?.age ?? item?.user?.age;
    const dob = item?.dob ?? item?.profile?.dob ?? item?.user?.dob;
    if (dob) {
      const d = new Date(dob);
      if (!isNaN(d.getTime())) {
        const today = new Date();
        let calcAge = today.getFullYear() - d.getFullYear();
        const m = today.getMonth() - d.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < d.getDate())) {
          calcAge -= 1;
        }
        if (calcAge < 18) return false;
      }
    }
    if (rawAge !== undefined && rawAge !== null && Number(rawAge) < 18) {
      return false;
    }
    return true;
  });

const isBlockedProfile = (item: any, blockedIds: string[]): boolean => {
  if (!blockedIds || blockedIds.length === 0) return false;
  const uid = String(resolveProfileUserId(item) || '').trim();
  const itemId = String(item?.id || '').trim();
  const itemUserId = String(item?.userId || item?.profile?.userId || '').trim();
  return (
    (Boolean(uid) && blockedIds.includes(uid)) ||
    (Boolean(itemId) && blockedIds.includes(itemId)) ||
    (Boolean(itemUserId) && blockedIds.includes(itemUserId))
  );
};

const UserList = ({
  filterByGender,
  mode = 'online',
  filteredProfiles = null,
  userLocation = null,
}: HomeUserListProps) => {
  useTranslation();
  const insets = useSafeAreaInsets();
  const { filterUsers, searchUsers } = useDiscovery();
  const { width, columns, getCardWidth } = useResponsive();
  const {
    showMe,
    authUserId,
    resetSearchFilters,
    setFilteredProfiles,
    location,
    distanceRange,
    isChecked,
  } = useContext(AppContext);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [resolvedBackendUserId, setResolvedBackendUserId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleResetFilters = async () => {
    try {
      setLoading(true);
      await resetSearchFilters();
      setFilteredProfiles(null);
      setRefreshKey((prev) => prev + 1);
    } catch (e) {
      console.error('Failed to reset search filters:', e);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setRefreshKey((prev) => prev + 1);
  };

  useFocusEffect(
    React.useCallback(() => {
      setRefreshKey((prev) => prev + 1);
    }, [])
  );

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
          if (filteredProfiles !== null) {
            items = filteredProfiles;
          } else if (hasFilters) {
            // Apply saved filters across tabs:
            const searchPayload: Record<string, any> = {
              ...savedFilters,
              userId: resolvedUserId || undefined,
              gender: savedFilters?.gender || (selectedGender === 'straight_man' ? ['Male'] : ['Female']),
              onlyOnline: mode === 'online' ? (savedFilters?.onlyOnline === true) : undefined,
              sortBy: mode === 'online' ? 'active' : 'createdAt',
              maxDistanceKm: (savedFilters?.maxDistanceKm ?? savedFilters?.searchRadius ?? savedFilters?.radius),
              searchRadius: (savedFilters?.maxDistanceKm ?? savedFilters?.searchRadius ?? savedFilters?.radius),
              radius: (savedFilters?.maxDistanceKm ?? savedFilters?.searchRadius ?? savedFilters?.radius),
              latitude: userLocation?.latitude,
              longitude: userLocation?.longitude,
              page: 0,
              size: 20,
            };
            const searchRes = await filterUsersMutationRef.current(searchPayload);
            items = parseUserCollection(searchRes);

            // If backend search returned empty, fallback to local mock search with payload
            if (!items || items.length === 0) {
              try {
                const { handleMockRequest } = require('../../mock/mockAdapter');
                const mockRes = await handleMockRequest({
                  method: 'POST',
                  url: '/search',
                  data: searchPayload,
                });
                items = mockRes?.data?.content || [];
              } catch {}
            }
          } else if (mode === 'online') {
            try {
              const res = await apiClient.get('/dashboard/online', {
                params: {
                  page: 0,
                  size: 50,
                  userId: resolvedUserId || undefined,
                  gender: selectedGender === 'straight_man' ? 'man' : 'woman',
                },
              });
              items = parseUserCollection(res.data);
            } catch (onlineError) {
              console.log('[UserList] /dashboard/online failed, trying fallback');
            }

            // Also fetch /dashboard/recent to include recently active accounts (like One)
            // so both online and recently active women appear on the "Last Active" tab!
            try {
              const recentRes = await apiClient.get('/dashboard/recent', {
                params: {
                  page: 0,
                  size: 50,
                  userId: resolvedUserId || undefined,
                  gender: selectedGender === 'straight_man' ? 'man' : 'woman',
                },
              });
              const recentItems = parseUserCollection(recentRes.data);
              if (recentItems && recentItems.length > 0) {
                const existingIds = new Set(
                  items.map((i: any) => String(resolveProfileUserId(i) || i?.id || ''))
                );
                for (const rItem of recentItems) {
                  const rId = String(resolveProfileUserId(rItem) || rItem?.id || '');
                  if (rId && !existingIds.has(rId)) {
                    existingIds.add(rId);
                    items.push(rItem);
                  }
                }
              }
            } catch (recentErr) {
              if (!items || items.length === 0) {
                console.log('[UserList] recent failed → using search');
                const searchRes = await searchUsersMutationRef.current({
                  sortBy: 'recent',
                  gender: selectedGender === 'straight_man' ? 'man' : 'woman',
                });
                items = parseUserCollection(searchRes);
              }
            }
          } else {
            // Newest Tab: Fetch recent profiles and live database users
            try {
              const res = await apiClient.get('/dashboard/recent', {
                params: {
                  page: 0,
                  size: 50,
                  userId: resolvedUserId || undefined,
                  gender: selectedGender === 'straight_man' ? 'man' : 'woman',
                },
              });
              items = parseUserCollection(res.data);
            } catch (recentError) {
              console.log('[UserList] /dashboard/recent error:', recentError);
            }

            // Also search newly registered database users by createdAt to guarantee newly created accounts appear!
            try {
              const searchRes = await searchUsersMutationRef.current({
                sortBy: 'createdAt',
                gender: selectedGender === 'straight_man' ? 'man' : 'woman',
              });
              const searchItems = parseUserCollection(searchRes);
              if (searchItems && searchItems.length > 0) {
                const existingIds = new Set(
                  items.map((i: any) => String(resolveProfileUserId(i) || i?.id || ''))
                );
                // Prepend newly registered database users at the top of the Newest tab!
                const newItemsToAdd: any[] = [];
                for (const sItem of searchItems) {
                  const sId = String(resolveProfileUserId(sItem) || sItem?.id || '');
                  if (sId && !existingIds.has(sId)) {
                    existingIds.add(sId);
                    newItemsToAdd.push(sItem);
                  }
                }
                items = [...newItemsToAdd, ...items];
              }
            } catch (searchError) {
              console.log('[UserList] searchUsers fallback error:', searchError);
            }

            // Fallback: If still empty, try /dashboard/recent without gender filter in case backend filters differently
            if (!items || items.length === 0) {
              try {
                const rawRecent = await apiClient.get('/dashboard/recent', {
                  params: { page: 0, size: 20, userId: resolvedUserId || undefined },
                });
                const rawItems = parseUserCollection(rawRecent.data);
                if (rawItems && rawItems.length > 0) {
                  items = rawItems;
                }
              } catch {}
            }
          }
        } catch (err) {
          console.warn('[UserList] All APIs failed');
          items = [];
        }

        // Demo / fallback safeguard: if empty, load from mock store and apply active filters
        if (!items || items.length === 0) {
          try {
            const { mockStore } = require('../../mock/mockStore');
            const targetGender = selectedGender === 'straight_man' ? 'man' : 'woman';
            const baseProfiles = await mockStore.getProfiles(targetGender);

            if (hasFilters && savedFilters) {
              let filtered = [...baseProfiles];
              if (Number.isFinite(Number(savedFilters.minAge))) {
                filtered = filtered.filter((p: any) => (p.age || 24) >= Number(savedFilters.minAge));
              }
              if (Number.isFinite(Number(savedFilters.maxAge))) {
                filtered = filtered.filter((p: any) => (p.age || 24) <= Number(savedFilters.maxAge));
              }
              if (Number.isFinite(Number(savedFilters.minHeight))) {
                filtered = filtered.filter((p: any) => (p.height || 165) >= Number(savedFilters.minHeight));
              }
              if (Number.isFinite(Number(savedFilters.maxHeight))) {
                filtered = filtered.filter((p: any) => (p.height || 165) <= Number(savedFilters.maxHeight));
              }
              if (Array.isArray(savedFilters.bodyType) && savedFilters.bodyType.length > 0) {
                filtered = filtered.filter((p: any) =>
                  !p.bodyType || savedFilters.bodyType?.some((bt: string) => String(p.bodyType).toLowerCase().includes(bt.toLowerCase()))
                );
              }
              if (Array.isArray(savedFilters.appearance) && savedFilters.appearance.length > 0) {
                filtered = filtered.filter((p: any) =>
                  !p.appearance || savedFilters.appearance?.some((app: string) => String(p.appearance).toLowerCase().includes(app.toLowerCase()))
                );
              }
              if (Array.isArray(savedFilters.language) && savedFilters.language.length > 0) {
                filtered = filtered.filter((p: any) =>
                  !p.language || savedFilters.language?.some((lang: string) => String(p.language).toLowerCase().includes(lang.toLowerCase()))
                );
              }
              if (Array.isArray(savedFilters.ethnicity) && savedFilters.ethnicity.length > 0) {
                filtered = filtered.filter((p: any) =>
                  !p.ethnicity || savedFilters.ethnicity?.some((eth: string) => String(p.ethnicity).toLowerCase().includes(eth.toLowerCase()))
                );
              }
              if (savedFilters.onlyOnline) {
                filtered = filtered.filter((p: any) => p.online === true);
              }
              items = filtered.length > 0 ? filtered : baseProfiles;
            } else {
              items = baseProfiles;
            }
          } catch {}
        }

        // Merge any locally registered profiles on this device so newly created accounts appear immediately
        try {
          const rawReg = await AsyncStorage.getItem('@amara_registered_profiles');
          if (rawReg) {
            const regList = JSON.parse(rawReg);
            if (Array.isArray(regList) && regList.length > 0) {
              const existingIds = new Set(
                items.map((i: any) => String(resolveProfileUserId(i) || i?.id || ''))
              );
              const newlyCreated: any[] = [];
              for (const rItem of regList) {
                const rId = String(resolveProfileUserId(rItem) || rItem?.id || '');
                if (rId && !existingIds.has(rId)) {
                  existingIds.add(rId);
                  newlyCreated.push({
                    ...rItem,
                    online: true,
                  });
                }
              }
              // Prepend newly created profiles at the very top of Discover!
              if (newlyCreated.length > 0) {
                items = [...newlyCreated, ...items];
              }
            }
          }
        } catch {}

        const activeGenders =
          savedFilters?.gender ||
          (savedFilters?.showMe ? [savedFilters.showMe] : (showMe ? [showMe] : null));
        const filteredByAttributes = hasFilters && savedFilters
          ? items.filter((item) => matchesSearchFilters(item, savedFilters))
          : items;
        const blockedUserIds = await getLocalBlockedUsers(resolvedUserId);
        const unblockedItems = filteredByAttributes.filter((item) => !isBlockedProfile(item, blockedUserIds));
        const genderMatched = unblockedItems.filter((item) =>
          matchesGenderSelection(item, selectedGender, activeGenders) &&
          (mode === 'online' && savedFilters?.onlyOnline ? (item?.online === true || item?.profile?.online === true) : true)
        );
        const invitable = keepInvitableProfiles(genderMatched);
        const shouldApplyRadiusFilter = Boolean(
          savedFilters &&
          savedFilters.isFilterActive !== false &&
          !savedFilters.worldwide &&
          ((savedFilters.maxDistanceKm !== undefined && savedFilters.maxDistanceKm !== 50) ||
           (savedFilters.searchRadius !== undefined && savedFilters.searchRadius !== 50) ||
           (savedFilters.radius !== undefined && savedFilters.radius !== 50) ||
           Boolean(savedFilters.hasExplicitDistance))
        );
        let radiusFiltered = invitable;
        if (shouldApplyRadiusFilter) {
          radiusFiltered = filterByRadius(invitable, savedFilters, userLocation, location);
        }
        const finalItems = resolvedBackendUserId
          ? radiusFiltered.filter((item) => {
              const itemUserId = String(resolveProfileUserId(item) || '');
              return itemUserId && itemUserId !== String(resolvedBackendUserId);
            })
          : radiusFiltered;

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
  }, [mode, filterByGender, showMe, resolvedBackendUserId, filteredProfiles, refreshKey, distanceRange, isChecked, userLocation, location]);

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
          onlyOnline: mode === 'online' ? (savedFilters?.onlyOnline === true) : undefined,
          sortBy: mode === 'online' ? 'active' : 'createdAt',
          page: nextPage,
          size: 10,
        };
        const searchRes = await filterUsersMutationRef.current(searchPayload);
        newItems = parseUserCollection(searchRes);
      } else {
        const endpoint = mode === 'online' ? '/dashboard/online' : '/dashboard/recent';
        const res = await apiClient.get(endpoint, {
          params: {
            page: nextPage,
            size: 10,
            userId: resolvedUserId || undefined,
            gender: selectedGender === 'straight_man' ? 'man' : 'woman',
          },
        });
        newItems = parseUserCollection(res.data);
      }
      if (!newItems || newItems.length === 0) {
        setHasMore(false);
      } else {
        const selectedGender = filterByGender || 'straight_woman';
        const activeGenders =
          savedFilters?.gender ||
          (savedFilters?.showMe ? [savedFilters.showMe] : (showMe ? [showMe] : null));
        const blockedUserIds = await getLocalBlockedUsers(resolvedUserId);
        const filteredByAttributes = hasFilters && savedFilters
          ? newItems.filter((item: any) => matchesSearchFilters(item, savedFilters))
          : newItems;
        const unblockedItems = filteredByAttributes.filter((item: any) => !isBlockedProfile(item, blockedUserIds));
        const genderMatched = unblockedItems.filter((item: any) =>
          matchesGenderSelection(item, selectedGender, activeGenders)
        );
        const invitable = keepInvitableProfiles(genderMatched);
        const shouldApplyRadiusFilter = Boolean(
          savedFilters &&
          savedFilters.isFilterActive !== false &&
          !savedFilters.worldwide &&
          ((savedFilters.maxDistanceKm !== undefined && savedFilters.maxDistanceKm !== 50) ||
           (savedFilters.searchRadius !== undefined && savedFilters.searchRadius !== 50) ||
           (savedFilters.radius !== undefined && savedFilters.radius !== 50) ||
           Boolean(savedFilters.hasExplicitDistance))
        );
        let radiusFiltered = invitable;
        if (shouldApplyRadiusFilter) {
          radiusFiltered = filterByRadius(invitable, savedFilters, userLocation, location);
        }
        const finalItems = resolvedBackendUserId
          ? radiusFiltered.filter((item: any) => {
              const itemUserId = String(resolveProfileUserId(item) || '');
              return itemUserId && itemUserId !== String(resolvedBackendUserId);
            })
          : radiusFiltered;

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
      style={styles.list}
      key={`userlist-cols-${columns}`}
      data={profiles}
      numColumns={columns}
      keyExtractor={(item, index) => item?.userId || item?.id?.toString() || index.toString()}
      columnWrapperStyle={columns > 1 ? styles.row : undefined}
      contentContainerStyle={[
        styles.container,
        profiles.length === 0 && styles.emptyContainer,
        {
          backgroundColor: themeColors.background,
          paddingBottom: Math.max(insets.bottom, 16) + 110,
        },
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
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
        const rawName = String(
          profile?.name ||
          profile?.displayName ||
          item?.name ||
          item?.email?.split('@')[0] ||
          profile?.email?.split('@')[0] ||
          t('home.usercard.user')
        );
        const cleanName = rawName.replace(/,\s*\d+$/, '').trim();
        const safeAge = profile?.age || item?.age || '24';
        return (
          <UserCard
            id={resolveProfileUserId(item) ?? item.id}
            name={cleanName}
            age={safeAge}
            image={resolveHomeCardImage(item)}
            distance={resolveProfileDistance(item, userLocation, location)}
            isOnline={profile?.online === true}
            isNew={mode === 'newest'}
            profileData={item}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
          />
        );
      }}
      ListEmptyComponent={
        loading ? null : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>
              {t('home.userlist.no_profiles_found_try_adjusting_your_search_settings')}
            </Text>
            <TouchableOpacity
              style={styles.resetButton}
              activeOpacity={0.85}
              onPress={handleResetFilters}
            >
              <MaterialCommunityIcons name="reload" size={18} color="#FFFFFF" style={styles.resetIcon} />
              <Text style={styles.resetButtonText}>{t('home.userlist.reset_filters')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.refreshButton}
              activeOpacity={0.7}
              onPress={handleRefresh}
            >
              <Text style={styles.refreshButtonText}>{t('home.userlist.refresh')}</Text>
            </TouchableOpacity>
          </View>
        )
      }
    />
  );
};

export default UserList;

const createStyles = (colors: any) =>
  StyleSheet.create({
    list: {
      flex: 1,
    },
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
    emptyContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loader: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    emptyBox: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.xxl,
    },
    emptyTitle: {
      color: colors.textPrimary,
      fontWeight: '600',
      fontSize: 16,
      lineHeight: 24,
      textAlign: 'center',
      marginBottom: 24,
    },
    resetButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: 25,
      paddingVertical: 13,
      paddingHorizontal: 28,
      minWidth: 160,
    },
    resetIcon: {
      marginRight: 8,
    },
    resetButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
    },
    refreshButton: {
      marginTop: 18,
      paddingVertical: 10,
      paddingHorizontal: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    refreshButtonText: {
      color: colors.textSecondary,
      fontSize: 15,
      fontWeight: '600',
    },
  });

