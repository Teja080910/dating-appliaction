import React, { useContext } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import mockUsers from '../../utils/mockUsers';
import UserCard from './UserCard';
import AppContext from '../../context/CreateGlobalStateContext';

interface HomeUserListProps {
  filterByGender: string | null;
}

const UserList = ({ filterByGender }: HomeUserListProps) => {
  const { filter } = useContext(AppContext);

  const filteredUsers = mockUsers.filter(user => {
    const genderMatch = user.gender === filterByGender;
    if (!genderMatch) return false;

    if (filter === 'newest') {
      // In a real app, this would be based on createdAt. 
      // For mock, we'll assume users with high IDs or a specific 'isNew' flag are new.
      // Let's add 'isNew' flag to some users later, or just show a different subset.
      return (user as any).isNew;
    } else {
      // For 'online' filter
      return (user as any).isOnline;
    }
  });

  return (
    <FlatList
      data={filteredUsers}
      numColumns={2}
      key={2}
      keyExtractor={(item) => item.id}
      columnWrapperStyle={styles.row}
      renderItem={({ item }) => (
        <UserCard
          name={item.name}
          age={item.age}
          image={item.image}
          distance={item.distance}
          isOnline={(item as any).isOnline}
          isNew={(item as any).isNew}
        />
      )}
      contentContainerStyle={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  container: {
    paddingTop: 10,
    paddingBottom: 100, 
    backgroundColor: '#FAFAFA', // Light grey matching screenshot bg
  },
});

export default UserList;
