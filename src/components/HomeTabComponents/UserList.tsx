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
import { AuthStorage } from '../../api/authStorage';
import { User, UserProfile } from '../../api/types';
import { colors } from '../../constants/theme';

interface HomeUserListProps {
  searchQuery: string;
}

const UserList = ({ searchQuery }: HomeUserListProps) => {
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

  // NOTE: /users/filter is non-functional on the deployed backend — it 400s
  // on every field (gender, age, bodyType, smoke, search, etc: "Could not
  // resolve attribute 'X' of com.dta.Dating_App.entitys.User"), confirmed by
  // live-testing every field individually. /home/allusers is the only
  // endpoint that actually returns data, but it doesn't accept any filter
  // params and doesn't include gender/bodyType/etc. in its response, so
  // there is currently no way — server- or client-side — to filter the Home
  // feed by gender or any other preference. Search is applied client-side
  // since the backend can't do it either.
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

      const homeData = await profileApi.getHomeUsers(uid);
      let usersData = extractUsers(homeData);

      const q = searchQuery.trim().toLowerCase();
      if (q) {
        usersData = usersData.filter((item) => {
          const name = (item.name || item.displayName || '').toLowerCase();
          const bio = (item.bio || '').toLowerCase();
          return name.includes(q) || bio.includes(q);
        });
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
  }, [searchQuery]);

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
        color={colors.primary}
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
