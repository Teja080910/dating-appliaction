import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { useNotification, EmailLogItem } from '../../api/useNotification';
import { Colors, Spacing, useTheme } from '../../theme';
import { t, useTranslation } from '../../i18n';

const formatTime = (value: string | null | undefined) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return t('profile.notificationsscreen.m_ago', { minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('profile.notificationsscreen.h_ago', { hours });
  return date.toLocaleDateString();
};

const NotificationsScreen = () => {
  useTranslation();
  const navigation = useNavigation();
  const { themeColors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(themeColors, isDark), [themeColors, isDark]);
  const [activeTab, setActiveTab] = useState<'notifications' | 'emails'>('notifications');

  const { useNotificationList, markRead, useMyEmails } = useNotification();
  const { data: notifications, isLoading, isRefetching, refetch } = useNotificationList();
  const {
    data: emails = [],
    isLoading: isEmailsLoading,
    isRefetching: isEmailsRefetching,
    refetch: refetchEmails,
  } = useMyEmails();

  const list = Array.isArray(notifications) ? notifications : [];
  const emailList = Array.isArray(emails) ? emails : [];

  const handlePress = (item: any) => {
    if (item && typeof item.id === 'number' && !item.read) {
      markRead.mutate(item.id);
    }
  };

  const renderNotificationItem = ({ item }: { item: any }) => {
    const isRead = Boolean(item?.read);
    return (
      <TouchableOpacity
        style={[styles.item, !isRead && styles.itemUnread]}
        activeOpacity={0.7}
        onPress={() => handlePress(item)}
      >
        <View style={[styles.iconCircle, !isRead && styles.iconCircleUnread]}>
          <Icon name="bell" size={18} color={isRead ? themeColors.textSecondary : themeColors.primary} />
        </View>
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Text style={[styles.itemTitle, !isRead && styles.itemTitleUnread]} numberOfLines={1}>
              {item?.title || t('profile.notificationsscreen.notification')}
            </Text>
            {!isRead && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.itemBody} numberOfLines={2}>
            {item?.body || item?.message || ''}
          </Text>
          <Text style={styles.itemTime}>{formatTime(item?.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmailItem = ({ item }: { item: EmailLogItem }) => {
    return (
      <View style={styles.item}>
        <View style={styles.iconCircle}>
          <Icon name="mail" size={18} color={themeColors.primary} />
        </View>
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {item.subject || 'Email Dispatch'}
            </Text>
            {item.status && (
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>{item.status.toUpperCase()}</Text>
              </View>
            )}
          </View>
          <Text style={styles.itemBody} numberOfLines={2}>
            {item.body || item.recipient || ''}
          </Text>
          <Text style={styles.itemTime}>{formatTime(item.sentAt)}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={themeColors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-left" size={28} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.notificationsscreen.notifications')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tabs Row */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'notifications' && styles.tabButtonActive]}
          onPress={() => setActiveTab('notifications')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabButtonText, activeTab === 'notifications' && styles.tabButtonTextActive]}>
            {t('profile.notificationsscreen.notifications', { defaultValue: 'Notifications' })}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'emails' && styles.tabButtonActive]}
          onPress={() => setActiveTab('emails')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabButtonText, activeTab === 'emails' && styles.tabButtonTextActive]}>
            {t('profile.notificationsscreen.emails', { defaultValue: 'Emails' })}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'notifications' ? (
        isLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={themeColors.primary} />
          </View>
        ) : list.length > 0 ? (
          <FlatList
            style={{ flex: 1 }}
            data={list}
            keyExtractor={(item, index) =>
              item?.id != null ? String(item.id) : String(index)
            }
            renderItem={renderNotificationItem}
            contentContainerStyle={[styles.listContainer, { paddingBottom: 40 }]}
            showsVerticalScrollIndicator={false}
            refreshing={isRefetching}
            onRefresh={() => refetch()}
          />
        ) : (
          <View style={styles.emptyView}>
            <View style={styles.emptyIcon}>
              <Icon name="bell-off" size={40} color={themeColors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>{t('profile.notificationsscreen.no_notifications')}</Text>
            <Text style={styles.emptyDesc}>{t('profile.notificationsscreen.when_you_receive_likes_matches_or_messages_they_will_show_up_here')}</Text>
          </View>
        )
      ) : (
        isEmailsLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={themeColors.primary} />
          </View>
        ) : emailList.length > 0 ? (
          <FlatList
            style={{ flex: 1 }}
            data={emailList}
            keyExtractor={(item, index) =>
              item?.id != null ? String(item.id) : String(index)
            }
            renderItem={renderEmailItem}
            contentContainerStyle={[styles.listContainer, { paddingBottom: 40 }]}
            showsVerticalScrollIndicator={false}
            refreshing={isEmailsRefetching}
            onRefresh={() => refetchEmails()}
          />
        ) : (
          <View style={styles.emptyView}>
            <View style={styles.emptyIcon}>
              <Icon name="mail" size={40} color={themeColors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>
              {t('profile.notificationsscreen.no_emails', { defaultValue: 'No Emails Sent' })}
            </Text>
            <Text style={styles.emptyDesc}>
              {t('profile.notificationsscreen.emails_desc', {
                defaultValue: 'Dispatched emails and verification notices will be logged here.',
              })}
            </Text>
          </View>
        )
      )}
    </SafeAreaView>
  );
};

export default NotificationsScreen;

const createStyles = (colors: any, isDark: boolean = true) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.screenPaddingHorizontal,
      paddingVertical: Spacing.md,
    },
    backBtn: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    headerSpacer: {
      width: 44,
    },
    tabsRow: {
      flexDirection: 'row',
      marginHorizontal: Spacing.screenPaddingHorizontal,
      marginBottom: Spacing.md,
      backgroundColor: colors.surface,
      borderRadius: Spacing.radiusMd,
      padding: 4,
      borderWidth: 1,
      borderColor: colors.border || colors.glassBorder,
    },
    tabButton: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Spacing.radiusSm,
    },
    tabButtonActive: {
      backgroundColor: colors.primary,
    },
    tabButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    tabButtonTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    statusBadge: {
      backgroundColor: isDark ? 'rgba(124, 58, 237, 0.2)' : '#EDE9FE',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    statusBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.primary,
    },
    loader: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    listContainer: {
      paddingHorizontal: Spacing.screenPaddingHorizontal,
      paddingBottom: Spacing.xl,
    },
    item: {
      flexDirection: 'row',
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      borderRadius: Spacing.radiusLg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border || colors.glassBorder,
    },
    itemUnread: {
      backgroundColor: colors.surfaceLight,
      borderColor: colors.primary,
    },
    iconCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.glass,
      marginRight: Spacing.md,
    },
    iconCircleUnread: {
      backgroundColor: isDark ? 'rgba(124, 58, 237, 0.2)' : 'rgba(124, 58, 237, 0.1)',
    },
    itemContent: {
      flex: 1,
    },
    itemHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    itemTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textSecondary,
      flexShrink: 1,
      marginRight: Spacing.sm,
    },
    itemTitleUnread: {
      color: colors.text,
      fontWeight: '700',
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    itemBody: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 4,
      lineHeight: 18,
    },
    itemTime: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 6,
    },
    emptyView: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.xl,
    },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.glass,
      marginBottom: Spacing.lg,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    emptyDesc: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });
