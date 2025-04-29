import React, { useContext } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';

const AvatarGroup = () => {
  const { oppositeGender } = useContext(AppContext);

  const isWoman = oppositeGender === 'straight_woman';

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
      <Image source={avatars[0]} style={styles.avatar} />
      <View style={styles.avatarContainer}>
        <Image source={avatars[1]} style={styles.avatar} />
        <Image source={require('../../assets/MessageTabImages/envelope.png')} style={styles.badge} />
      </View>
      <Image source={avatars[2]} style={styles.avatar} />
    </View>
  );
};

export default AvatarGroup;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
