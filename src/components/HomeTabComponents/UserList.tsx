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
    if (item.id !== undefined && (item.profile || item.name)) {
      return { ...item, id: numericId } as User;
    }
    return {
      id: numericId,
      userId: item.userId || '',
      name: item.name || item.displayName || '',
      profile: {
        id: numericId,
        displayName: item.name || item.displayName || '',
        name: item.name || item.displayName || '',
        bio: item.bio || '',
        age: item.age || undefined,
        currentCity: item.currentCity || item.city || '',
        profileImageUrl: item.profileImageUrl || '',
        language: item.language || '',
        height: item.height || undefined,
        bodyType: item.bodyType || '',
        appearance: item.appearance || '',
        ethnicity: item.ethnicity || '',
        englishLevel: item.englishLevel || '',
        smoke: item.smoke || '',
        drink: item.drink || '',
        lookingFor: item.lookingFor || '',
        gender: item.gender || '',
        orientation: item.orientation || '',
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

      try {
        const homeData = await profileApi.getHomeUsers(uid);
        usersData = extractUsers(homeData);
      } catch (homeErr) {
        console.error('getHomeUsers failed:', homeErr);
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
