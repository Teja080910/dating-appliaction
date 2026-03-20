// components/ChatWithUsRow.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ChatWithUs = ({ onPress }: any) => {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={styles.left}>
        <MaterialCommunityIcons name="message-text-outline" size={22} style={styles.icon} />
        <Text style={styles.text}>Chat with us</Text>
      </View>
      <Icon name="chevron-right" size={26} color="#c4c4c4" style={styles.chevron} />
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
    flex: 1,

    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
    color: '#000',
  },
  text: {
    flexShrink: 1,

    fontSize: 16,
    color: '#000',
  },
  chevron: {}
});

export default ChatWithUs;
