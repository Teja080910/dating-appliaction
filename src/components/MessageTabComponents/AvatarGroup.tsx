import React, { useContext } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';

const AvatarGroup = () => {
  const { oppositeGender } = useContext(AppContext);

  // ✅ SAFE CHECK
  const isWoman = oppositeGender === 'straight_woman';

  // ✅ SAFE IMAGE ARRAY
  const avatars = isWoman
    ? [
        require('../../assets/MessageTabImages/girl1.webp'),
        require('../../assets/MessageTabImages/girl2.webp'),
        require('../../assets/MessageTabImages/girl3.webp'),
      ]
    : [
        require('../../assets/MessageTabImages/boy1.webp'),
        require('../../assets/MessageTabImages/boy2.webp'),
        require('../../assets/MessageTabImages/boy3.webp'),
      ];

  return (
    <View style={styles.row}>
      {/* LEFT */}
      <Image source={avatars?.[0]} style={styles.avatar} />

      {/* CENTER WITH BADGE */}
      <View style={styles.avatarContainer}>
        <Image source={avatars?.[1]} style={styles.avatar} />

        {/* ✅ BADGE SAFE */}
        <Image
          source={require('../../assets/MessageTabImages/envelope.png')}
          style={styles.badge}
        />
      </View>

      {/* RIGHT */}
      <Image source={avatars?.[2]} style={styles.avatar} />
    </View>
  );
};

export default AvatarGroup;

// ================= STYLES =================
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center', // ✅ alignment fix
    marginVertical: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginHorizontal: 5, // ❗ gap fix (React Native me gap support nahi hota)
  },
  avatarContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
  },
});