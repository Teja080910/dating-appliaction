import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { userApi } from '../api/userApi';
import { SearchFilterRequest, UserSearchResponse } from '../api/types';
import AuthImage from '../components/AuthImage';
import { resolveImageUri } from '../utils/imageUtils';
import { colors, radius, shadow, typography } from '../constants/theme';

const CARD_WIDTH = (Dimensions.get('window').width - 30) / 2;

// UserSearchResponse has no user identifier at all (confirmed against the
// live backend — /search intentionally returns a slim, non-clickable
// preview shape), so results here are display-only, unlike Home's UserCard
// which navigates to a full profile.
const SearchResultCard = ({ item }: { item: UserSearchResponse }) => (
  <View style={s.card}>
    <View style={s.imageContainer}>
      {item.profileImageUrl ? (
        <AuthImage uri={resolveImageUri(item.profileImageUrl)} style={s.image} />
      ) : (
        <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={[s.image, s.placeholder]}>
          <Text style={s.placeholderText}>{item.name?.charAt(0)?.toUpperCase() || '?'}</Text>
        </LinearGradient>
      )}
      <LinearGradient
        colors={['transparent', 'rgba(36,17,26,0.15)', 'rgba(36,17,26,0.9)']}
        locations={[0, 0.5, 1]}
        style={s.scrim}
      />
      <View style={s.info}>
        <Text style={s.name} numberOfLines={1}>
          {item.name}{item.age ? <Text style={s.age}>, {item.age}</Text> : null}
        </Text>
        {item.currentCity ? <Text style={s.city} numberOfLines={1}>{item.currentCity}</Text> : null}
      </View>
    </View>
    {item.bio ? (
      <View style={s.bioWrap}>
        <Text style={s.bio} numberOfLines={2}>{item.bio}</Text>
      </View>
    ) : null}
  </View>
);

const SearchResultsScreen = ({ route, navigation }: any) => {
  const filters = (route?.params?.filters as SearchFilterRequest) || {};
  const [results, setResults] = useState<UserSearchResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const runSearch = async () => {
      setLoading(true);
      setError(false);
      try {
        const data = await userApi.searchUsers(filters);
        setResults(Array.isArray(data) ? data : []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    runSearch();
  }, []);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Search Results</Text>
      </View>

      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={s.centered}>
          <Text style={s.emptyText}>Couldn't load search results.</Text>
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          numColumns={2}
          key={2}
          keyExtractor={(_, i) => String(i)}
          columnWrapperStyle={s.row}
          renderItem={({ item }) => <SearchResultCard item={item} />}
          contentContainerStyle={s.listContent}
        />
      ) : (
        <View style={s.centered}>
          <Text style={s.emptyText}>No users match your search</Text>
        </View>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceAlt },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  title: { ...typography.title, color: colors.ink },
  emptyText: { fontSize: 16, color: colors.inkMuted, textAlign: 'center', paddingHorizontal: 24 },
  row: { justifyContent: 'space-between' },
  listContent: { paddingHorizontal: 10, paddingTop: 10, paddingBottom: 40 },
  card: {
    width: CARD_WIDTH, borderRadius: radius.lg, backgroundColor: colors.surface, overflow: 'hidden',
    marginBottom: 16, marginHorizontal: 7.5,
    ...shadow.card,
  },
  imageContainer: { position: 'relative', height: 200 },
  image: { width: '100%', height: '100%' },
  placeholder: { justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 42, color: colors.surface, fontWeight: '800' },
  scrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' },
  info: { position: 'absolute', left: 12, right: 12, bottom: 10 },
  name: { ...typography.bodyMedium, fontWeight: '700', color: colors.surface },
  age: { fontWeight: '400' as const, color: 'rgba(255,255,255,0.9)' },
  city: { fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: '500', marginTop: 2 },
  bioWrap: { padding: 12, paddingTop: 10 },
  bio: { fontSize: 12, color: colors.inkMuted, lineHeight: 16 },
});

export default SearchResultsScreen;
