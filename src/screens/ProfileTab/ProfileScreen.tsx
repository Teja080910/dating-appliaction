import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
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

const ProfileScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootParamList>>();
  const { logout, deleteAccount } = useAuth();
  const { alert, AlertComponent } = useAlert();

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
    alert('Delete Profile', 'Are you sure you want to permanently delete your profile?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete My Profile',
        onPress: () => {
          alert('Final Warning', 'All your matches, photos, and messages will be lost forever. Still proceed?', [
            { text: 'No', style: 'cancel' },
            {
              text: 'Yes, Delete Everything',
              onPress: async () => {
                try {
                  const userId = await getUserId();
                  if (userId) {
                    deleteAccount.mutate(userId, {
                      onSuccess: async () => {
                        await clearFullSession();
                        alert('Profile Deleted', 'Your account has been successfully removed.');
                        navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
                      },
                      onError: async () => {
                        await clearFullSession();
                        navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
                      },
                    });
                  }
                } catch (error) {
                  console.error('Delete error:', error);
                }
              },
              style: 'destructive',
            },
          ]);
        },
        style: 'destructive',
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Header />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
            onPress={() => navigation.navigate('ViewMyProfileScreen', { userId: undefined })}
          />
          <ProfileRow
            title="Notifications"
            iconName="bell"
            color={Colors.primaryLight}
            onPress={() => navigation.navigate('NotificationsScreen')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <ProfileRow
            title="Connect Telegram"
            iconName="send"
            color={Colors.primaryLight}
            onPress={() => navigation.navigate('ConnectTelegram')}
          />
          <ProfileRow
            title="Chat with us"
            iconName="message-circle"
            color={Colors.success}
            onPress={() => navigation.navigate('SupportScreen')}
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
});

export default ProfileScreen;
