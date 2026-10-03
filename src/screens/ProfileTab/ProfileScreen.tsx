import React, { useContext, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../../components/ProfileTabComponents/Header';
import AdditionalUploadSection from '../../components/ProfileTabComponents/AdditionalUploadSection';
import ModalAddPhoto from '../../components/UploadImageComponents/ModalAddPhoto';
import ProfileRow from '../../components/ProfileTabComponents/ProfileRow';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { RootParamList } from '../../utils/types/navigation.types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../api/useAuth';
import { clearFullSession } from '../../utils/session';
import { useAlert } from '../../components/AlertModal';
import { getUserId } from '../../utils/sessionHelper';
import { Colors, Spacing, Shadows, Typography } from '../../theme';
import AppContext from '../../context/CreateGlobalStateContext';
import { useSubscription, useRemainingDays } from '../../api/useSubscription';
import { useMyProfile } from '../../api/useProfile';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ProfileScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootParamList>>();
  const { setViewMyProfile, setPaywallVisible } = useContext(AppContext);
  const { logout, deleteAccount } = useAuth();
  const { alert, AlertComponent } = useAlert();
  const { subscriptionStatus } = useSubscription();
  const { remainingDays } = useRemainingDays();
  const { data: myProfile } = useMyProfile();
  const [storedGender, setStoredGender] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem('userGender').then((g) => {
      if (isMounted && g) setStoredGender(g);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const cleanGender = (myProfile?.gender || storedGender || '').toLowerCase();
  const isWoman = cleanGender.includes('woman') || cleanGender.includes('female');

  const handleLogout = async () => {
    alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            await logout();
            navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
          } catch (error) {
            console.error('Logout error:', error);
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const handleDeleteProfile = async () => {
    alert(
      'Delete Profile',
      'Are you sure you want to permanently delete your profile? All your matches, photos, and messages will be lost forever.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete My Profile',
          style: 'destructive',
          onPress: async () => {
            try {
              const resolvedUserId = (await getUserId()) || myProfile?.userId || myProfile?.id;
              deleteAccount.mutate(resolvedUserId, {
                onSuccess: async () => {
                  await clearFullSession();
                  alert('Profile Deleted', 'Your account has been successfully removed.');
                  navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
                },
                onError: async (error: any) => {
                  console.error('Delete error:', error);
                  await clearFullSession();
                  navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
                },
              });
            } catch (error) {
              console.error('Delete error:', error);
              await clearFullSession();
              navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
            }
          },
        },
      ]
    );
  };

  const isSubscribed = Boolean(subscriptionStatus?.active);
  const planCode = String(subscriptionStatus?.plan || '').toUpperCase();
  const planName = planCode === 'PREMIUM' ? 'Elite' : planCode === 'GOLD' ? 'Premium' : planCode === 'BASIC' ? 'Standard' : 'Standard';
  const daysLeft = typeof remainingDays === 'number' ? remainingDays : 0;
  const isElite = Boolean(subscriptionStatus?.eliteBadge || planCode === 'PREMIUM');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Header />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* PRD FR-35 & TC-30: Active membership plan badge, remaining days countdown, and renew/upgrade button (Men only) */}
        {!isWoman && (
          <View style={styles.membershipCardWrapper}>
            <LinearGradient
              colors={isSubscribed ? [Colors.primary, Colors.secondary] : ['#374151', '#1f2937']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.membershipCard}
            >
              <View style={styles.membershipHeader}>
                <View style={styles.membershipBadgeRow}>
                  <Icon
                    name={isSubscribed ? 'crown' : 'shield-account-outline'}
                    size={20}
                    color={Colors.white}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.membershipPlanTitle}>
                    {isSubscribed ? `${planName.toUpperCase()} MEMBER` : 'FREE PLAN'}
                  </Text>
                </View>
                <View style={styles.membershipStatusRow}>
                  {isSubscribed && (
                    <View style={styles.daysBadge}>
                      <Text style={styles.daysBadgeText}>
                        {daysLeft > 0 ? `${daysLeft} days left` : 'Active'}
                      </Text>
                    </View>
                  )}
                  {isElite && (
                    <View style={styles.eliteBadge}>
                      <Icon name="crown" size={13} color="#4A3200" style={styles.eliteBadgeIcon} />
                      <Text style={styles.eliteBadgeText}>Elite member</Text>
                    </View>
                  )}
                </View>
              </View>

              <Text style={styles.membershipSubtitle}>
                {isSubscribed
                  ? planCode === 'PREMIUM'
                    ? 'Enjoy unlimited invitations, priority Telegram handoff, and your Elite badge.'
                    : planCode === 'GOLD'
                      ? 'Enjoy 20 invitations per day and priority Telegram handoff.'
                      : 'Enjoy 10 invitations per day with Telegram handoff after approval.'
                  : 'Upgrade to send requests, connect on Telegram, and unlock all features.'}
              </Text>

              <TouchableOpacity
                style={styles.upgradeBtn}
                activeOpacity={0.8}
                onPress={() => setPaywallVisible(true)}
              >
                <Text style={styles.upgradeBtnText}>
                  {isSubscribed ? 'Renew / Upgrade Plan' : 'View Membership Plans'}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <AdditionalUploadSection />
          <ModalAddPhoto />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <ProfileRow
            title="Profile Settings"
            iconName="user"
            onPress={() => navigation.navigate('ProfileSettingsScreen')}
          />
          <ProfileRow
            title="View My Profile"
            iconName="eye"
            onPress={() => {
              setViewMyProfile(true);
              navigation.navigate('ViewMyProfileScreen', { userId: undefined });
            }}
          />
          <ProfileRow
            title={
              myProfile?.telegramUsername
                ? `Telegram (@${myProfile.telegramUsername.replace(/^@/, '')})`
                : 'Connect Telegram'
            }
            iconName="send"
            color={Colors.primaryLight}
            onPress={() => navigation.navigate('ConnectTelegram', { fromProfile: true } as any)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <ProfileRow
            title="Privacy Policy"
            iconName="shield"
            color={Colors.info}
            onPress={() => navigation.navigate('PrivacyPolicy', { type: 'privacy' })}
          />
          <ProfileRow
            title="Terms & Conditions"
            iconName="file-text"
            color={Colors.info}
            onPress={() => navigation.navigate('PrivacyPolicy', { type: 'terms' })}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.error }]}>Danger Zone</Text>
          <ProfileRow
            title="Logout"
            iconName="log-out"
            color={Colors.error}
            onPress={handleLogout}
          />
          <ProfileRow
            title="Delete My Profile"
            iconName="trash-2"
            color={Colors.textMuted}
            onPress={handleDeleteProfile}
          />
        </View>

        <Text style={styles.footerText}>AMARA - All Rights Reserved</Text>
      </ScrollView>
      {AlertComponent}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  section: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.divider,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surfaceLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footerText: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: Spacing.xxl,
    marginBottom: Spacing.xl,
    letterSpacing: 1,
  },
  membershipCardWrapper: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  membershipCard: {
    borderRadius: Spacing.radiusLg,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  membershipHeader: {
    flexDirection: 'column',
    alignItems: 'stretch',
    marginBottom: Spacing.xs,
  },
  membershipBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  membershipStatusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  membershipPlanTitle: {
    ...Typography.h3,
    color: Colors.white,
    fontWeight: '800',
    flexShrink: 1,
  },
  daysBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Spacing.radiusSm,
  },
  daysBadgeText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.white,
  },
  eliteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Spacing.radiusSm,
    maxWidth: '100%',
  },
  eliteBadgeIcon: {
    marginRight: 4,
  },
  eliteBadgeText: {
    ...Typography.caption,
    fontWeight: '800',
    color: '#4A3200',
    flexShrink: 1,
  },
  membershipSubtitle: {
    ...Typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.85)',
    marginVertical: Spacing.sm,
    lineHeight: 18,
  },
  upgradeBtn: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Spacing.radiusMd,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  upgradeBtnText: {
    ...Typography.button,
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
});

export default ProfileScreen;
