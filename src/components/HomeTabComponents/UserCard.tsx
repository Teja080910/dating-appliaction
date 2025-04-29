// import React from 'react';
// import { View, Text, Image, StyleSheet } from 'react-native';

// interface UserCardProps {
//   name: string;
//   age: number;
//   distance: string;
//   image: string;
// }

// const UserCard = ({ name, age, distance, image }: UserCardProps) => {
//   return (
//     <View style={styles.card}>
//       <Image source={{ uri: image }} style={styles.image} />
//       <View style={styles.details}>
//         <Text style={styles.name}>{name}, {age}</Text>
//         <Text style={styles.distance}>{distance}</Text>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   card: {
//     margin: 10,
//     borderRadius: 15,
//     overflow: 'hidden',
//     backgroundColor: '#fff',
//     shadowColor: '#000',
//     shadowOpacity: 0.1,
//     shadowOffset: { width: 0, height: 5 },
//     shadowRadius: 10,
//     elevation: 4,
//   },
//   image: {
//     width: '100%',
//     height: 300,
//   },
//   details: {
//     padding: 15,
//   },
//   name: {
//     fontSize: 22,
//     fontWeight: '600',
//   },
//   distance: {
//     fontSize: 16,
//     color: '#888',
//     marginTop: 5,
//   },
// });

// export default UserCard;








// // components/UserCard.tsx

// import React from 'react';
// import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';

// interface UserCardProps {
//   name: string;
//   age: number;
//   image: string;
// }

// const CARD_WIDTH = (Dimensions.get('window').width - 45) / 2; // spacing + 2 columns

// const UserCard = ({ name, age, image }: UserCardProps) => {
//   return (
//     <View style={styles.card}>
//       <Image source={{ uri: image }} style={styles.image} />
//       <Text style={styles.name}>{name}, {age}</Text>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   card: {
//     width: CARD_WIDTH,
//     borderRadius: 12,
//     backgroundColor: '#fff',
//     overflow: 'hidden',
//     marginBottom: 15,
//     marginHorizontal: 7.5,
//     shadowColor: '#000',
//     shadowOpacity: 0.1,
//     shadowOffset: { width: 0, height: 4 },
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   image: {
//     width: '100%',
//     height: 170,
//     borderTopLeftRadius: 12,
//     borderTopRightRadius: 12,
//   },
//   name: {
//     fontSize: 16,
//     fontWeight: '600',
//     padding: 10,
//   },
// });

// export default UserCard;








// components/UserCard.tsx

import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';

interface UserCardProps {
  name: string;
  age: number;
  image: string;
  distance: string;
}

const CARD_WIDTH = (Dimensions.get('window').width - 45) / 2;

const UserCard = ({ name, age, image, distance }: UserCardProps) => {
  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: image }} style={styles.image} />
        <View style={styles.overlayText}>
          <Text style={styles.name}>{name}, {age}</Text>
          <Text style={styles.distance}>{distance}</Text>
        </View>
      </View>
      {/* <Text style={styles.distance}>{distance}</Text> */}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
    marginBottom: 15,
    marginHorizontal: 7.5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 170,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  overlayText: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'trasparent',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  distance: {
    color: 'white'
  },
});

export default UserCard;
