import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { RootParamList } from '../../utils/types/navigation.types';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors, radius, typography } from '../../constants/theme';

interface Props {
  searchQuery: string;
  onSearchChange: (text: string) => void;
}

type HomeHeaderNavigationProp = StackNavigationProp<RootParamList, 'SearchSettings'>;

const HomeHeader = ({ searchQuery, onSearchChange }: Props) => {
  const navigation = useNavigation<HomeHeaderNavigationProp>();
  const handleSearchSettingsPress = () => {
     navigation.navigate('SearchSettings');
  }
  return (
    <View style={styles.wrapper}>
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <Icon name="heart" solid size={20} color={colors.primary} style={styles.logoIcon} />
          <Text style={styles.logo}>Dating</Text>
        </View>
        <TouchableOpacity style={styles.menuBtn} onPress={handleSearchSettingsPress}>
          <Ionicons name="options-outline" size={20} color={colors.ink} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.inkFaint} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name..."
          placeholderTextColor={colors.inkFaint}
          value={searchQuery}
          onChangeText={onSearchChange}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')}>
            <Ionicons name="close-circle" size={18} color={colors.inkFaint} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: colors.surface,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoIcon: { marginRight: 8 },
  logo: {
    ...typography.title,
    color: colors.ink,
  },
  menuBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    marginTop: 14,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: colors.ink, padding: 0 },
});

export default HomeHeader;
