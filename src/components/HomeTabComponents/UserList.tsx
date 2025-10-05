import React, { useContext, useEffect } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import mockUsers from '../../utils/mockUsers';
import UserCard from './UserCard';
import AppContext from '../../context/CreateGlobalStateContext';

interface HomeUserListProps {
  filterByGender: string | null;
}

const UserList = ({ filterByGender }: HomeUserListProps) => {
  const filteredUsers = mockUsers.filter(user => user.gender === filterByGender);
  // const {viewMyProfile, setViewMyProfile} = useContext(AppContext)
  // useEffect(() => {
  //   console.log('View My Profile:', viewMyProfile);
    
  // },[viewMyProfile])
  

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
        />
      )}
      contentContainerStyle={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  row: {
    justifyContent: 'space-between',
  },
  container: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 100, // 👈 important fix: gives space at the bottom
  },
});

export default UserList;

