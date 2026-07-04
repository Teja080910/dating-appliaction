import React, { useEffect, useState, useCallback } from 'react';
import {
  FlatList,
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserCard from './UserCard';
import { profileApi } from '../../api/profileApi';
import { userApi } from '../../api/userApi';
import { AuthStorage } from '../../api/authStorage';
import { User, UserProfile, UserFilterRequest } from '../../api/types';

interface HomeUserListProps {
  filterByGender: string | null;
  searchQuery: string;
}

const UserList = ({ filterByGender, searchQuery }: HomeUserListProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toUser = (item: any): User | null => {
    if (!item) return null;
    const rawId = item.id ?? item.userId ?? 0;
    const numericId = typeof rawId === 'number' ? rawId : Number(String(rawId).replace(/\D/g, '')) || 0;
    const profileImageUrl = item.profileImageUrl || item.profile?.profileImageUrl || '';
    const name = item.name || item.displayName || item.profile?.displayName || item.profile?.name || '';
    const age = item.age || item.profile?.age || undefined;
    const bio = item.bio || item.profile?.bio || '';
    const city = item.currentCity || item.city || item.profile?.currentCity || '';
    const language = item.language || item.profile?.language || '';
    const height = item.height || item.profile?.height || undefined;
    const bodyType = item.bodyType || item.profile?.bodyType || '';
    const appearance = item.appearance || item.profile?.appearance || '';
    const ethnicity = item.ethnicity || item.profile?.ethnicity || '';
    const englishLevel = item.englishLevel || item.profile?.englishLevel || '';
    const smoke = item.smoke || item.profile?.smoke || '';
    const drink = item.drink || item.profile?.drink || '';
    const lookingFor = item.lookingFor || item.profile?.lookingFor || '';
    const gender = item.gender || item.profile?.gender || '';
    const orientation = item.orientation || item.profile?.orientation || '';
    const userId = item.userId || '';

    return {
      id: numericId,
      userId,
      name,
      profile: {
        id: numericId,
        displayName: name,
        name,
        bio,
        age,
        currentCity: city,
        profileImageUrl,
        language,
        height,
        bodyType,
        appearance,
        ethnicity,
        englishLevel,
        smoke,
        drink,
        lookingFor,
        gender,
        orientation,
      } as UserProfile,
    } as User;
  };

  const extractUsers = (data: any): any[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.data && Array.isArray(data.data)) return data.data;
    if (data.content && Array.isArray(data.content)) return data.content;
    if (data.users && Array.isArray(data.users)) return data.users;
    if (data.results && Array.isArray(data.results)) return data.results;
    return [];
  };

  const fetchUsers = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const userData = await AuthStorage.getUser();
      const uid = userData?.userId || (await AuthStorage.getUserIdStr());
      if (!uid) {
        setError('User not logged in');
        setLoading(false);
        return;
      }

      let usersData: any[] = [];

      const filterParams: UserFilterRequest = {
        userId: uid,
        gender: ['female'],
        page: 0,
        size: 50,
      };

      if (searchQuery.trim()) {
        filterParams.search = searchQuery.trim();
      }

      try {
        const savedFilters = await AsyncStorage.getItem('searchFilters');
        if (savedFilters) {
          const parsed = JSON.parse(savedFilters);
          if (parsed.ageRange) {
            filterParams.minAge = parsed.ageRange[0];
            filterParams.maxAge = parsed.ageRange[1];
          }
          if (parsed.distanceRange && parsed.distanceRange < 1100) {
            filterParams.maxDistanceKm = parsed.distanceRange;
          }
          if (parsed.isChecked) filterParams.worldwide = true;
          if (parsed.bodyHeight) {
            filterParams.minHeight = parsed.bodyHeight[0];
            filterParams.maxHeight = parsed.bodyHeight[1];
          }
          if (parsed.selectBodyTypes?.length) filterParams.bodyType = parsed.selectBodyTypes;
          if (parsed.selectedOptions?.length) filterParams.appearance = parsed.selectedOptions;
          if (parsed.searchLanguages?.length) filterParams.language = parsed.searchLanguages;
          if (parsed.englishProficiency?.length) filterParams.englishLevel = parsed.englishProficiency;
          if (parsed.ethnicity?.length) filterParams.ethnicity = parsed.ethnicity;
          if (parsed.lookingFor?.length) filterParams.lookingFor = parsed.lookingFor;
          if (parsed.smoke?.length) {
            filterParams.smoke = parsed.smoke.includes('No') ? false : true;
          }
        }
      } catch {}

      try {
        const response = await userApi.filterUsers(filterParams);
        usersData = extractUsers(response);
      } catch {
        try {
          const homeData = await profileApi.getHomeUsers(uid);
          usersData = extractUsers(homeData);
        } catch {}
      }

      const mapped = usersData.map(toUser).filter(Boolean) as User[];
      setUsers(mapped);
    } catch (err: any) {
      const msg = err?.message || err?.toString() || 'unknown error';
      console.error('fetchUsers outer catch:', msg);
      setError('Failed to load users. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterByGender, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers(true);
  };

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color="#FF1493"
        style={styles.centered}
      />
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (users.length === 0) {
    return <Text style={styles.empty}>No users found</Text>;
  }

  return (
    <FlatList
      data={users}
      numColumns={2}
      key={2}
      keyExtractor={(item, index) => `${item.id || index}-${item.userId || index}`}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => (
        <UserCard
          name={item.name || item.profile?.displayName || 'Unknown'}
          age={item.profile?.age || 0}
          image={item.profile?.profileImageUrl || ''}
          city={item.profile?.currentCity || ''}
          bio={item.profile?.bio || ''}
          userId={item.id}
          userUserId={item.userId}
          userData={item}
        />
      )}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    />
  );
};

const styles = StyleSheet.create({
  row: { justifyContent: 'space-between' },
  container: { paddingHorizontal: 10, paddingTop: 10, paddingBottom: 100 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { textAlign: 'center', color: 'red', marginTop: 20 },
  empty: { textAlign: 'center', color: '#666', marginTop: 20, fontSize: 16 },
});

export default UserList;
