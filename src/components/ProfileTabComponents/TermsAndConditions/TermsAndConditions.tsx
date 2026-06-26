import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Icon from 'react-native-vector-icons/Feather';
import { Colors, Spacing } from '../../../theme';

const TermsAndConditions = ({ onPress }: any) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.leftSection}>
        <FontAwesome5 name="file-alt" size={18} color={Colors.text} style={styles.icon} />
        <Text style={styles.text}>Terms and Conditions</Text>
      </View>
    <Icon name="chevron-right" size={23} color={Colors.textMuted} style={styles.chevron} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  text: {
    flexShrink: 1,
    fontSize: 16,
    color: Colors.text,
  },
   chevron: {}
});

export default TermsAndConditions;
