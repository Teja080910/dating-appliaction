import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, Shadows } from '../../theme';

interface ProfileRowProps {
  title: string;
  iconName: string;
  iconType?: 'Feather' | 'FontAwesome5' | 'MaterialCommunityIcons';
  onPress?: () => void;
  color?: string;
  showChevron?: boolean;
}

const ProfileRow = ({
  title,
  iconName,
  iconType = 'Feather',
  onPress,
  color = Colors.primary,
  showChevron = true,
}: ProfileRowProps) => {
  const renderIcon = () => {
    const iconProps = { size: 16, color: Colors.white };
    switch (iconType) {
      case 'FontAwesome5':
        return <FontAwesome5 name={iconName} {...iconProps} />;
      case 'MaterialCommunityIcons':
        return <MaterialCommunityIcons name={iconName} size={18} color={Colors.white} />;
      default:
        return <Icon name={iconName} {...iconProps} />;
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconWrapper, { backgroundColor: color }]}>
        {renderIcon()}
      </View>
      <Text style={styles.text}>{title}</Text>
      {showChevron && <Icon name="chevron-right" size={18} color={Colors.textMuted} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: Spacing.radiusSm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  text: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
});

export default ProfileRow;
