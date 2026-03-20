// components/ChangeLocationRow.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Feather from 'react-native-vector-icons/Feather';
import Icon from 'react-native-vector-icons/Feather';

const ChangeLocation = ({ onPress }: any) => {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={styles.left}>
        <FontAwesome5 name="globe-europe" size={20} style={styles.icon} />
        <Text style={styles.text}>Change location</Text>
      </View>
      {/* <Feather name="chevron-right" size={20} color="#c4c4c4" /> */}
      <Icon name="chevron-right" size={23} color="#c4c4c4" style={styles.chevron} />
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
    color: '#2f2f2f',
  },
  text: {
    flexShrink: 1,

    fontSize: 16,
    color: '#000',
  },
  chevron: {}
});

export default ChangeLocation;
