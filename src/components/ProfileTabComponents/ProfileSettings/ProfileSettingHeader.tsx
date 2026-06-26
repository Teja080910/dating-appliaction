import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Spacing } from '../../../theme';

interface ProfileSettingsHeaderProps {
  onSave: () => void;
  loading: boolean;
}

const ProfileSettingsHeader: React.FC<ProfileSettingsHeaderProps> = ({ onSave, loading }) => {
  const navigation = useNavigation();
  const onCancel = () => {
    navigation.goBack()
  }

  return (
    <SafeAreaView>
      <LinearGradient
        colors={[Colors.surface, Colors.surfaceLight]}
        style={styles.header}
      >
        <TouchableOpacity onPress={onCancel}>
          <Icon name="x" size={28} color={Colors.text} />
        </TouchableOpacity>

        <Text style={styles.title}>Profile settings</Text>

        <TouchableOpacity onPress={onSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <Icon name="check" size={28} color={Colors.primary} />
          )}
        </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  title: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '600',
  },
});

export default ProfileSettingsHeader;
