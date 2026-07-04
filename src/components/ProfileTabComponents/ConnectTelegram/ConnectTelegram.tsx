// components/ConnectTelegramRow.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';

const ConnectTelegram = ({ onPress }: any) => {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={styles.left}>
        <FontAwesome name="send" size={20} style={styles.icon} />
        <Text style={styles.text}>Connect Your Telegram</Text>
      </View>
      <Feather name="chevron-right" size={23} color="#c4c4c4" style={styles.chevron} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#f2f2f2',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
    color: '#000',
    transform: [{ rotate: '5deg' }], // mimic paper plane direction
  },
  text: {
    fontSize: 16,
    color: '#000',
  },
  chevron: {
    marginLeft: 140,
  }
});

export default ConnectTelegram;
