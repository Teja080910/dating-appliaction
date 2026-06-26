import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import { RootParamList } from '../../../utils/types/navigation.types';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors, Spacing } from '../../../theme';

const ProfileSetting = () => {
  const navigation = useNavigation<StackNavigationProp<RootParamList,'ProfileSettingsScreen'>>();
  const handlePress = () => {
    navigation.navigate('ProfileSettingsScreen');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>ACCOUNT SETTINGS</Text>
      <TouchableOpacity style={styles.itemRow} onPress={handlePress}>
        <View style={styles.iconWrapper}>
          <Icon name="cog" solid size={16} color={Colors.white} />
        </View>
        <Text style={styles.itemText}>Profile settings</Text>
        <Icon name="chevron-right" size={16} color={Colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
};

export default ProfileSetting;

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    textTransform: 'uppercase',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
    fontWeight: '500',
  },
});
