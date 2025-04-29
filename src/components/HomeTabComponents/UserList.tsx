// import React from 'react';
// import { FlatList } from 'react-native';
// import mockUsers from '../utils/mockUsers';
// import UserCard from './UserCard';

// interface HomeUserListProps {
//   filterByGender: string | null;
// }

// const UserList = ({ filterByGender }: HomeUserListProps) => {
//   const filteredUsers = mockUsers.filter(user => user.gender === filterByGender);

//   return (
//     <FlatList
//       data={filteredUsers}
//       keyExtractor={(item) => item.id}
//       renderItem={({ item }) => (
//         <UserCard
//           name={item.name}
//           age={item.age}
//           distance={item.distance}
//           image={item.image}
//         />
//       )}
//     />
//   );
// };

// export default UserList;










// /// components/UserList.tsx

// import React from 'react';
// import { FlatList, View, StyleSheet } from 'react-native';
// import mockUsers from '../utils/mockUsers';
// import UserCard from './UserCard';

// interface HomeUserListProps {
//   filterByGender: string | null;
// }

// const UserList = ({ filterByGender }: HomeUserListProps) => {
//   const filteredUsers = mockUsers.filter(user => user.gender === filterByGender);

//   return (
//     <FlatList
//       data={filteredUsers}
//       numColumns={2}
//       key={2}
//       keyExtractor={(item) => item.id}
//       columnWrapperStyle={styles.row}
//       renderItem={({ item }) => (
//         <UserCard
//           name={item.name}
//           age={item.age}
//           image={item.image}
//         />
//       )}
//       contentContainerStyle={{ paddingHorizontal: 10, paddingTop: 10 }}
//     />
//   );
// };

// const styles = StyleSheet.create({
//   row: {
//     justifyContent: 'space-between',
//   },
// });

// export default UserList;











// // components/UserList.tsx

// import React from 'react';
// import { FlatList, View, StyleSheet } from 'react-native';
// import mockUsers from '../utils/mockUsers';
// import UserCard from './UserCard';

// interface HomeUserListProps {
//   filterByGender: string | null;
// }

// const UserList = ({ filterByGender }: HomeUserListProps) => {
//   const filteredUsers = mockUsers.filter(user => user.gender === filterByGender);

//   return (
//       <FlatList
//       data={filteredUsers}
//       numColumns={2}
//       key={2}
//       keyExtractor={(item) => item.id}
//       columnWrapperStyle={styles.row}
//       renderItem={({ item }) => (
//         <UserCard
//           name={item.name}
//           age={item.age}
//           image={item.image}
//           distance={item.distance}
//         />
//       )}
//       contentContainerStyle={{ paddingHorizontal: 10, paddingTop: 10 }}
//     />
    
//   );
// };

// const styles = StyleSheet.create({
//   row: {
//     justifyContent: 'space-between',
//   },
// });

// export default UserList;









import React from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import mockUsers from '../../utils/mockUsers';
import UserCard from './UserCard';

interface HomeUserListProps {
  filterByGender: string | null;
}

const UserList = ({ filterByGender }: HomeUserListProps) => {
  const filteredUsers = mockUsers.filter(user => user.gender === filterByGender);

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

