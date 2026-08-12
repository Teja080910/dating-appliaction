import React, { useContext } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import Feather from 'react-native-vector-icons/Feather';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useConnection } from '../../../api/useConnection';
import { useReport } from '../../../api/useReport';
import AppContext from '../../../context/CreateGlobalStateContext';
import { Colors } from '../../../theme';
import { isResolvedApiUserId, repairStoredSessionIdentity } from '../../../utils/session';
import { getAuthToken } from '../../../utils/sessionHelper';
import { useAlert } from '../../../components/AlertModal';

interface UserDetailsProps {
  profile?: any;
  currentUserId?: string | number | null;
  targetUserId?: string | number | null;
}

const { width: windowWidth } = Dimensions.get('window');
const isCompactDevice = windowWidth < 380;

const UserDetails: React.FC<UserDetailsProps> = ({ profile: propProfile, currentUserId, targetUserId }) => {
  const { 
    name, 
    displayName,
    date, 
    viewMyProfile, 
    cardUserName, 
    cardUserAge,
    selectedUserImage,
    height,
    englishSkillLevel,
    selectedEthinicity,
    selectedSmoking,
    selectedDrinking,
    setInvitations,
    invitations,
    setPaywallVisible,
    isSubscribed,
    verifiedSelfie,
    profileText,
    selectedAppearance,
    selectedBodyType,
    selectedLookingFor,
    selectedLanguages,
  } = useContext(AppContext);

  // 🔄 Use prop profile if available, else fall back to context (legacy match)
  const profile = propProfile || {};
  const resolvedProfile = profile?.profile || profile;
  const connection = useConnection(currentUserId || undefined);
  const reportApi = useReport(currentUserId || undefined);
  const { alert, AlertComponent } = useAlert();

  const normalizeTextValue = (value: unknown, fallback: string) => {
    if (Array.isArray(value)) {
      const joined = value.map((item) => String(item).trim()).filter(Boolean).join(', ');
      return joined || fallback;
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    if (typeof value === 'string') {
      return value.trim() || fallback;
    }

    if (typeof value === 'number') {
      return String(value);
    }

    return fallback;
  };

  const currentYear = new Date().getFullYear();
  const myAge = date ? (currentYear - date.getFullYear()) : 25;
  const resolveNumericIdentifier = (...values: unknown[]) => {
    for (const value of values) {
      const normalized = String(value ?? '').trim();
      if (/^[A-Za-z]+\d+$/.test(normalized)) {
        return normalized;
      }
      if (/^\d+$/.test(normalized)) {
        const numericValue = Number(normalized);
        if (Number.isFinite(numericValue) && numericValue > 0) {
          return numericValue;
        }
      }
    }

    return null;
  };

  const resolvedTargetUserId = resolveNumericIdentifier(
    targetUserId,
    propProfile?.targetUserId,
    propProfile?.target?.id,
    propProfile?.target?.userId,
    propProfile?.profileId,
    propProfile?.id,
    propProfile?.userId,
    propProfile?.uid,
    propProfile?.profile?.targetUserId,
    propProfile?.profile?.profileId,
    propProfile?.profile?.target?.id,
    propProfile?.profile?.target?.userId,
    propProfile?.profile?.id,
    propProfile?.profile?.userId,
    propProfile?.profile?.uid,
    propProfile?.user?.id,
    propProfile?.user?.userId,
    propProfile?.user?.profileId,
    resolvedProfile?.id,
    resolvedProfile?.targetUserId,
    resolvedProfile?.profileId,
    resolvedProfile?.target?.id,
    resolvedProfile?.target?.userId,
    resolvedProfile?.userId,
    resolvedProfile?.uid,
    resolvedProfile?.user?.id,
    resolvedProfile?.user?.userId,
    resolvedProfile?.user?.profileId,
  );
  const isOwnProfile = Boolean(
    viewMyProfile ||
    (currentUserId && resolvedTargetUserId && Number(currentUserId) === Number(resolvedTargetUserId))
  );

  const finalDisplayName = isOwnProfile
    ? normalizeTextValue(
        resolvedProfile?.displayName || profile.displayName || displayName || name,
        'User'
      )
    : normalizeTextValue(
        resolvedProfile?.displayName || profile.displayName || profile.name || cardUserName,
        'User'
      );

  const displayAge = isOwnProfile
    ? normalizeTextValue(resolvedProfile?.age || profile.age, String(myAge))
    : normalizeTextValue(resolvedProfile?.age || profile.age || cardUserAge, 'N/A');

  // Check if this user is already invited
  const isAlreadyInvited = invitations?.some((inv: any) => Number(inv.receiverId || inv.id) === Number(resolvedTargetUserId));
  const resolvedLanguages = (isOwnProfile || propProfile)
    ? normalizeTextValue(resolvedProfile?.language || profile.language, '')
        .split(',')
        .map((lang) => lang.trim())
        .filter(Boolean)
    : selectedLanguages;
  const locationText = normalizeTextValue(
    resolvedProfile?.currentCity || profile?.currentCity,
    isOwnProfile ? 'Your location' : 'Nearby'
  );
  const canAttemptInvite = Boolean(resolvedTargetUserId);

  const handleInvite = async () => {
    // Always show the paywall first for unsubscribed users.
    // Invite-specific identity validation should happen only after payment intent.
    if (!isSubscribed) {
        setPaywallVisible(true);
        return;
    }

    const repairedCurrentUserId =
      currentUserId ||
      (() => {
        return null;
      })();
    let activeCurrentUserId = repairedCurrentUserId;

    if (!isResolvedApiUserId(activeCurrentUserId)) {
      const repairedId = await repairStoredSessionIdentity();
      if (repairedId && isResolvedApiUserId(repairedId)) {
        activeCurrentUserId = String(repairedId);
      }
    }

    if (!resolvedTargetUserId) {
      console.warn('[invite] Missing target user id for profile:', {
        targetUserId,
        propProfileId: propProfile?.id,
        propProfileUserId: propProfile?.userId,
        propProfileTargetUserId: propProfile?.targetUserId,
        resolvedProfileId: resolvedProfile?.id,
        resolvedProfileUserId: resolvedProfile?.userId,
        resolvedProfileTargetUserId: resolvedProfile?.targetUserId,
      });
      Toast.show({
        type: 'error',
        text1: 'User unavailable',
        text2: 'This profile cannot be invited right now.',
      });
      return;
    }

    if (!activeCurrentUserId) {
      const token = await getAuthToken();
      Toast.show({
        type: 'error',
        text1: 'Account Sync Needed',
        text2: token
          ? 'Your login is missing a valid account id from the server.'
          : 'Please log in again and try once more.',
      });
      return;
    }

    if (isAlreadyInvited) {
        Toast.show({ type: 'info', text1: 'Already invited!' });
        return;
    }

    const inviteData = {
        receiverId: resolvedTargetUserId,
        name: finalDisplayName || "Guest",
        age: displayAge || 25,
        image: selectedUserImage || '',
    };

    connection.send.mutate({
      receiverId: String(resolvedTargetUserId),
      senderId: String(activeCurrentUserId),
    }, {
      onSuccess: () => {
        const newInvite = {
          id: Date.now().toString(),
          ...inviteData,
          status: 'Pending',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setInvitations([newInvite, ...invitations]);
        connection.refreshAll();
        Toast.show({ type: 'success', text1: 'Invitation sent!' });
      },
      onError: (error: any) => {
        Toast.show({
          type: 'error',
          text1: 'Invite failed',
          text2: error?.response?.data?.message || 'Please try again.',
        });
      },
    });
  };

  const handleReport = () => {
      if (!resolvedTargetUserId || !currentUserId) {
        Toast.show({ type: 'error', text1: 'User unavailable' });
        return;
      }

      alert(
          "Report Profile",
          "Are you sure you want to report or block this user?",
          [
              { text: "Cancel", style: "cancel" },
              { text: "Report", style: "destructive", onPress: () => {
                  reportApi.report.mutate({
                    byUserId: currentUserId,
                    targetUserId: resolvedTargetUserId,
                    reason: 'Profile report',
                    message: `Reported profile: ${finalDisplayName || 'Unknown user'}`,
                  }, {
                    onSuccess: () => {
                      Toast.show({ type: 'info', text1: 'Profile reported successfully.' });
                    },
                    onError: () => {
                      Toast.show({ type: 'error', text1: 'Report failed', text2: 'Please try again.' });
                    },
                  });
              }}
          ]
      );
  }

  const DetailPill = ({ icon, text }: { icon: string, text: string }) => (
    <View style={styles.pill}>
      <Icon name={icon} size={18} color={Colors.primary} style={styles.pillIcon} />
      <Text style={styles.pillText}>{text}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={styles.headerArea}>
        <View style={styles.nameRow}>
          <Text style={styles.nameText}>{finalDisplayName || "User"}, {displayAge}</Text>
          {(profile?.verifiedSelfie || resolvedProfile?.verifiedSelfie || verifiedSelfie) && (
            <Icon name="check-decagram" size={24} color={Colors.primary} style={styles.verifiedIcon} />
          )}
        </View>
        
        <View style={styles.statusRow}>
            <View style={styles.statusItem}>
                <Feather name="clock" size={12} color="#AAA" />
                <Text style={styles.statusText}>Active today</Text>
            </View>
            <View style={styles.statusItem}>
                <Feather name="navigation" size={12} color="#AAA" />
                <Text style={styles.statusText}>{locationText}</Text>
            </View>
        </View>
      </View>

      {/* Bio Section */}
      <View style={styles.section}>
          <Text style={styles.sectionTitle}>About me</Text>
          <Text style={styles.bioText}>
              {resolvedProfile?.bio || profile?.bio || profileText || "No bio added yet. Write something about yourself!"}
          </Text>
      </View>

      {/* More Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>More info</Text>
        <View style={styles.pillsContainer}>
          <DetailPill icon="emoticon-happy-outline" text={normalizeTextValue(resolvedProfile?.appearance || profile?.appearance, selectedAppearance || "Natural")} />
          <DetailPill icon="ruler" text={`${normalizeTextValue(resolvedProfile?.height || profile?.height, String(height || '---'))} cm`} />
          <DetailPill icon="human-handsup" text={normalizeTextValue(resolvedProfile?.bodyType || profile?.bodyType, selectedBodyType || "Average")} />
          <DetailPill icon="ear-hearing" text={normalizeTextValue(resolvedProfile?.englishLevel || profile?.englishLevel, englishSkillLevel === 3 ? 'Native' : englishSkillLevel === 2 ? 'Advanced' : englishSkillLevel === 1 ? 'Intermediate' : 'Beginner')} />
          <DetailPill icon="account-outline" text={normalizeTextValue(resolvedProfile?.ethnicity || profile?.ethnicity, selectedEthinicity || "Not specified")} />
          <DetailPill icon="smoking" text={`Smoke: ${normalizeTextValue(resolvedProfile?.smoke || profile?.smoke, selectedSmoking || 'No')}`} />
          <DetailPill icon="glass-cocktail" text={`Drink: ${normalizeTextValue(resolvedProfile?.drink || profile?.drink, selectedDrinking || 'No')}`} />
          <DetailPill icon="baby-face-outline" text={`Soon: ${normalizeTextValue(resolvedProfile?.lookingFor || profile?.lookingFor, Array.isArray(selectedLookingFor) ? selectedLookingFor.join(', ') : (selectedLookingFor || "Relationship"))}`} />
        </View>
      </View>

      {/* Languages Section */}
      {(resolvedLanguages?.length || 0) > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Languages</Text>
          <View style={styles.pillsContainer}>
            {resolvedLanguages.map((lang: string) => (
              <View key={lang} style={styles.pill}>
                <Icon name="translate" size={16} color={Colors.primary} style={{ marginRight: 8 }} />
                <Text style={styles.pillText}>{lang}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Action Buttons */}
      {!isOwnProfile && (
        <View style={styles.actionSection}>
            <TouchableOpacity 
              activeOpacity={0.7} 
              style={styles.reportBtn} 
              onPress={handleReport}
            >
                 <Icon name="alert-octagon-outline" size={18} color="#FF5A79" />
                 <Text style={styles.reportText}>Report / block this profile</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.9} 
              style={[styles.inviteBtn, (!canAttemptInvite || isAlreadyInvited) && styles.disabledBtn]} 
              onPress={handleInvite}
              disabled={!canAttemptInvite || isAlreadyInvited || connection.send.isPending}
            >
                 {connection.send.isPending ? (
                   <ActivityIndicator color="#fff" />
                 ) : (
                   <>
                     <Icon
                       name={!canAttemptInvite ? "lock-outline" : isAlreadyInvited ? "check-all" : "heart-flash"}
                       size={22}
                       color="#fff"
                       style={styles.inviteIcon}
                     />
                     <Text style={styles.inviteText}>
                       {!canAttemptInvite ? "Invite Unavailable" : isAlreadyInvited ? "Invited" : "Invite Now"}
                     </Text>
                   </>
                 )}
            </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 60 }} />
      {AlertComponent}
    </View>
  );
};

export default UserDetails;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 25,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -40,
    paddingTop: 35,
  },
  headerArea: {
      marginBottom: 35,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  nameText: {
    fontSize: isCompactDevice ? 24 : 28,
    fontWeight: '900',
    color: Colors.text,
  },
  verifiedIcon: {
    marginLeft: 12,
  },
  statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 18,
  },
  statusItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
  },
  statusText: {
      fontSize: isCompactDevice ? 13 : 14,
      color: Colors.textSecondary,
      fontWeight: '600',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: isCompactDevice ? 18 : 20,
    fontWeight: '900',
    color: Colors.text,
    marginBottom: 16,
  },
  bioText: {
      fontSize: isCompactDevice ? 15 : 16,
      color: Colors.textSecondary,
      lineHeight: 24,
      fontWeight: '500',
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
      backgroundColor: Colors.glass,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
  },
  interestText: {
      color: Colors.primary,
      fontSize: 14,
      fontWeight: '700',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 25,
    paddingHorizontal: isCompactDevice ? 14 : 16,
    paddingVertical: isCompactDevice ? 9 : 10,
    marginBottom: 4,
    backgroundColor: Colors.surface,
  },
  pillIcon: {
    marginRight: 8,
  },
  flag: {
      fontSize: 18,
      marginRight: 10,
  },
  pillText: {
    fontSize: isCompactDevice ? 14 : 15,
    color: Colors.text,
    fontWeight: '700',
  },
  actionSection: {
      gap: 18,
      marginTop: 15,
  },
  reportBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 56,
      borderRadius: 15,
      borderWidth: 1.5,
      borderColor: Colors.border,
      gap: 10,
  },
  reportText: {
      color: Colors.textMuted,
      fontSize: 15,
      fontWeight: '600',
  },
  inviteBtn: {
      backgroundColor: Colors.primary,
      minHeight: isCompactDevice ? 60 : 66,
      borderRadius: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 6,
  },
  disabledBtn: {
      backgroundColor: Colors.textMuted,
      shadowOpacity: 0,
      elevation: 0,
  },
  inviteIcon: {
      transform: [{ rotate: '-15deg' }],
  },
  inviteText: {
      color: '#fff',
      fontSize: isCompactDevice ? 18 : 20,
      fontWeight: '900',
  },
});
