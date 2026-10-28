import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import { useReport, BlockedUserItem } from '../../api/useReport';
import { Colors, Spacing, useTheme, type ThemeColors } from '../../theme';
import { useAlert } from '../../components/AlertModal';
import { t, useTranslation } from '../../i18n';

const BlockedUsersScreen = () => {
  useTranslation();
  const navigation = useNavigation();
  const { themeColors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(themeColors, isDark), [themeColors, isDark]);
  const { alert, AlertComponent } = useAlert();
  const { useBlockedUsers, unblock } = useReport();
  const { data: blockedUsers = [], isLoading, isRefetching, refetch } = useBlockedUsers();
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const handleUnblock = (user: BlockedUserItem) => {
    Alert.alert(
      t('profile.blockedusers.unblock_user', { defaultValue: 'Unblock User' }),
      t('profile.blockedusers.unblock_confirmation', {
        defaultValue: `Are you sure you want to unblock ${user.name || 'this user'}? They will be able to see your profile again.`,
      }),
      [
        {
          text: t('profile.additionaluploadsection.cancel', { defaultValue: 'Cancel' }),
          style: 'cancel',
        },
        {
          text: t('profile.blockedusers.unblock', { defaultValue: 'Unblock' }),
          style: 'destructive',
          onPress: async () => {
            try {
              setUnblockingId(user.userId);
              await unblock.mutateAsync({ targetUserId: user.userId });
              await refetch();
              alert(
                t('profile.supportscreen.success', { defaultValue: 'Success' }),
                t('profile.blockedusers.user_unblocked_success', {
                  defaultValue: 'The user has been unblocked.',
                })
              );
            } catch (err: any) {
              alert(
                t('profile.additionaluploadsection.error', { defaultValue: 'Error' }),
                err?.message || 'Failed to unblock user.'
              );
            } finally {
              setUnblockingId(null);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: BlockedUserItem }) => {
    const isProcessing = unblockingId === item.userId;

    return (
      <View style={styles.card}>
        <View style={styles.avatarWrap}>
          {item.photo ? (
            <Image source={{ uri: item.photo }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Icon name="account-cancel" size={26} color={themeColors.textSecondary} />
            </View>
          )}
        </View>

        <View style={styles.infoWrap}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.name || `User ${item.userId}`}
          </Text>
          <Text style={styles.userSubtitle}>
            {t('profile.userdetails.user_blocked', { defaultValue: 'Blocked' })}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.unblockBtn}
          onPress={() => handleUnblock(item)}
          disabled={isProcessing}
          activeOpacity={0.7}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.unblockBtnText}>
              {t('profile.blockedusers.unblock', { defaultValue: 'Unblock' })}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={themeColors.background}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather name="chevron-left" size={26} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('profile.blockedusers.blocked_users', { defaultValue: 'Blocked Users' })}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      ) : blockedUsers.length === 0 ? (
        <View style={styles.emptyBox}>
          <View style={styles.emptyIconCircle}>
            <Icon name="shield-check-outline" size={56} color={themeColors.primary} />
          </View>
          <Text style={styles.emptyTitle}>
            {t('profile.blockedusers.no_blocked_users', {
              defaultValue: 'No Blocked Users',
            })}
          </Text>
          <Text style={styles.emptySubtitle}>
            {t('profile.blockedusers.no_blocked_subtitle', {
              defaultValue: 'Users you block will appear here. You can unblock them anytime.',
            })}
          </Text>
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          keyExtractor={(item) => String(item.userId)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onRefresh={refetch}
          refreshing={isRefetching}
          showsVerticalScrollIndicator={false}
        />
      )}

      {AlertComponent}
    </SafeAreaView>
  );
};

export default BlockedUsersScreen;

const createStyles = (themeColors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    backBtn: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: themeColors.text,
    },
    headerRight: {
      width: 40,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 24,
      gap: 12,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: themeColors.surface,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    avatarWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      overflow: 'hidden',
      marginRight: 14,
    },
    avatar: {
      width: '100%',
      height: '100%',
      borderRadius: 24,
    },
    avatarPlaceholder: {
      width: '100%',
      height: '100%',
      backgroundColor: isDark ? '#232836' : '#F1F5F9',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 24,
    },
    infoWrap: {
      flex: 1,
      marginRight: 10,
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
      marginBottom: 3,
    },
    userSubtitle: {
      fontSize: 13,
      color: themeColors.textSecondary,
    },
    unblockBtn: {
      backgroundColor: themeColors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      minWidth: 80,
      alignItems: 'center',
      justifyContent: 'center',
    },
    unblockBtnText: {
      color: '#FFFFFF',
      fontSize: 13.5,
      fontWeight: '600',
    },
    centerBox: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyBox: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emptyIconCircle: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: isDark ? 'rgba(124, 58, 237, 0.15)' : '#F3E8FF',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: themeColors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 14,
      color: themeColors.textSecondary,
      textAlign: 'center',
      lineHeight: 21,
    },
  });
