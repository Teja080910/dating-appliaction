import React, { useEffect, useState, useCallback } from 'react';
import {
  FlatList,
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  RefreshControl,
} from 'react-native';
import UserCard from './UserCard';
import { profileApi } from '../../api/profileApi';
import { userApi } from '../../api/userApi';
import { AuthStorage } from '../../api/authStorage';
import { User, UserProfile } from '../../api/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface HomeUserListProps {
  filterByGender: string | null;
  searchQuery: string;
}

const UserList = ({ filterByGender, searchQuery }: HomeUserListProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizeUser = (item: any): User => {
    if (item.id !== undefined && (item.profile || item.name)) {
      return item as User;
    }
    return {
      id: item.id || item.userId || 0,
      name: item.name || item.displayName || '',
      userId: item.userId || '',
      profile: item as UserProfile,
    } as User;
  };

  const fetchUsers = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const userIdStr = await AuthStorage.getUserIdStr();
      if (!userIdStr) return;

      let usersData: any[] = [];

      if (searchQuery.trim().length > 0) {
        const results = await userApi.searchUsers({
          name: searchQuery.trim(),
          gender: filterByGender === 'female' ? 'female' : filterByGender === 'male' ? 'male' : undefined,
        });
        usersData = results || [];
      } else {
        let homeSucceeded = false;

        try {
          const homeData = await profileApi.getHomeUsers(userIdStr);
          const homeUsers = homeData?.data || homeData as any;
          if (Array.isArray(homeUsers)) {
            usersData = homeUsers;
            homeSucceeded = true;
          }
        } catch {}

        if (!homeSucceeded && usersData.length === 0) {
          const genderFilter =
            filterByGender === 'straight_woman' || filterByGender === 'female'
              ? ['female']
              : filterByGender === 'straight_man' || filterByGender === 'male'
              ? ['male']
              : undefined;

          let savedFilters: any = {};
          try {
            const filters = await AsyncStorage.getItem('searchFilters');
            if (filters) savedFilters = JSON.parse(filters);
          } catch {}

          const response = await userApi.filterUsers({
            userId: userIdStr,
            gender: genderFilter,
            minAge: savedFilters?.ageRange?.[0],
            maxAge: savedFilters?.ageRange?.[1],
            maxDistanceKm: savedFilters?.distanceRange,
            minHeight: savedFilters?.bodyHeight?.[0],
            maxHeight: savedFilters?.bodyHeight?.[1],
            page: 0,
            size: 50,
          });
          usersData = response.content || [];
        }
      }

      setUsers(usersData.map(normalizeUser));
    } catch (err: any) {
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
  } return (
    <FlatList
      data={users}
      numColumns={2}
      key={2}
      keyExtractor={(item) => `${item.id}-${item.userId}`}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => (
        <UserCard
          name={item.name || item.profile?.displayName || 'Unknown'}
          age={item.profile?.age || 0}
          image={item.profile?.profileImageUrl || ''}
          distance={item.profile?.currentCity || 'Unknown'}
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
