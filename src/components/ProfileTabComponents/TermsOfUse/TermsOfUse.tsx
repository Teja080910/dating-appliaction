import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
// import Feather from 'react-native-vector-icons/Feather';
import Icon from 'react-native-vector-icons/Feather';

const TermsOfUse = ({ onPress }: any) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.leftSection}>
        <FontAwesome5 name="file-alt" size={18} color="#1f1f1f" style={styles.icon} />
        <Text style={styles.text}>Terms of use</Text>
      </View>
    <Icon name="chevron-right" size={23} color="#c4c4c4" style={styles.chevron} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#f2f2f2',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  text: {
    fontSize: 16,
    color: '#1f1f1f',
  },
   chevron: {
    marginLeft: 217,
  }
});

export default TermsOfUse;
