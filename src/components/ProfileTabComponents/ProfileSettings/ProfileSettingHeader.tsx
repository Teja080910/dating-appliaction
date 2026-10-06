import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, useTheme } from '../../../theme';

interface ProfileSettingsHeaderProps {
  onSave?: () => void;
  loading?: boolean;
}

const ProfileSettingsHeader: React.FC<ProfileSettingsHeaderProps> = () => {
  const navigation = useNavigation();
  const { themeColors } = useTheme();

  return (
    <View style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.borderLight }]}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
        activeOpacity={0.7}
      >
        <Icon name="chevron-left" size={32} color={themeColors.text} />
      </TouchableOpacity>
      <Text style={[styles.title, { color: themeColors.text }]}>Edit Profile</Text>
    </View>
  );
};

export default ProfileSettingsHeader;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
    marginRight: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
