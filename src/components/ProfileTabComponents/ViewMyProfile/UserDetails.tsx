import React, { useContext, useMemo } from 'react';
import {
  ActivityIndicator,
  Linking,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import Feather from 'react-native-vector-icons/Feather';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useConnection } from '../../../api/useConnection';
import { useReport } from '../../../api/useReport';
import AppContext from '../../../context/CreateGlobalStateContext';
import { Colors } from '../../../theme';
import { isResolvedApiUserId, repairStoredSessionIdentity } from '../../../utils/session';
import { getAuthToken } from '../../../utils/sessionHelper';
import { getUserFriendlyMessage, isSubscriptionGateError } from '../../../utils/userFriendlyMessages';
import { useAlert } from '../../../components/AlertModal';

interface UserDetailsProps {
  profile?: any;
  currentUserId?: string | number | null;
  targetUserId?: string | number | null;
  requestId?: string | number | null;
  requestRole?: 'received' | 'sent';
  requestStatus?: string | null;
}

const UserDetails: React.FC<UserDetailsProps> = ({
  profile: propProfile,
  currentUserId,
  targetUserId,
  requestId,
  requestRole,
  requestStatus,
}) => {
  const hiddenLanguages = new Set(['telugu']);
  const hiddenLookingForValues = new Set(['long-term relationship']);
  const capitalizeLabel = (value: string) =>
    value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
  const navigation = useNavigation<any>();
  const { width: windowWidth } = useWindowDimensions();
  const isCompactDevice = windowWidth < 380;
  const styles = useMemo(() => createStyles(isCompactDevice), [isCompactDevice]);
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
  const isReceivedPendingRequest =
    requestRole === 'received' && String(requestStatus || '').toUpperCase() !== 'APPROVED';

  const handleApproveRequest = () => {
    if (!requestId) return;
    connection.accept.mutate(requestId, {
      onSuccess: () => {
        connection.refreshAll();
        alert('Request Approved', 'This connection is approved. Telegram contact is now available when connected.', [
          { text: 'Done', onPress: () => navigation.goBack() },
        ]);
      },
      onError: (error: any) => {
        alert("Couldn't approve invitation", getUserFriendlyMessage(error, 'We could not approve this invitation right now.'));
      },
    });
  };

  const handleOpenTelegram = (username?: string) => {
    if (!username) {
      alert('Telegram not connected', 'They have not connected Telegram yet. You can still keep in touch here.');
      return;
    }
    const cleanUsername = username.replace('@', '');
    const url = `https://t.me/${cleanUsername}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          alert('Open Link', `Open in browser: ${url}`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open', onPress: () => Linking.openURL(url) },
          ]);
        }
      })
      .catch(() => {
        Linking.openURL(url);
      });
  };

  const handleShareTelegram = async (username?: string) => {
    if (!username) {
      alert('Telegram not connected', 'No username available to share.');
      return;
    }
    const cleanUsername = username.replace('@', '');
    try {
      await Share.share({
        message: `@${cleanUsername} (https://t.me/${cleanUsername})`,
      });
    } catch {
      // User dismissed share dialog
    }
  };

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
      if (/^[A-Za-z0-9_-]+$/.test(normalized) && /[A-Za-z]/.test(normalized)) {
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

  const candidateIds = [
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
  ];

  const resolvedTargetUserId = resolveNumericIdentifier(...candidateIds);

  const isSameAsCurrentUser = Boolean(
    currentUserId &&
    resolvedTargetUserId &&
    String(currentUserId).trim().toLowerCase() === String(resolvedTargetUserId).trim().toLowerCase()
  );

  const isOwnProfile = Boolean(
    isSameAsCurrentUser ||
    (viewMyProfile && (!targetUserId || isSameAsCurrentUser)) ||
    (!resolvedTargetUserId && !targetUserId)
  );

  const finalDisplayName = (
    isOwnProfile
      ? normalizeTextValue(
          resolvedProfile?.name ||
            resolvedProfile?.displayName ||
            profile.name ||
            profile.displayName ||
            name ||
            displayName,
          'User'
        )
      : normalizeTextValue(
          resolvedProfile?.name ||
            resolvedProfile?.displayName ||
            profile.name ||
            profile.displayName ||
            cardUserName,
          'User'
        )
  ).replace(/,\s*\d+$/, '').trim() || 'User';

  const displayAge = isOwnProfile
    ? normalizeTextValue(resolvedProfile?.age || profile.age, String(myAge || 25))
    : normalizeTextValue(resolvedProfile?.age || profile.age || cardUserAge, '24');

  // Check if this user is already invited (from sent or received connections API)
  const sentConnections = Array.isArray(connection.sentList.data) ? connection.sentList.data : [];
  const matchingInvitation = sentConnections.find((inv: any) => {
    const receiverId = inv?.receiver?.id ?? inv?.receiver?.userId ?? inv?.receiverId ?? inv?.id;
    if (!receiverId || !resolvedTargetUserId) return false;
    return String(receiverId).trim().toLowerCase() === String(resolvedTargetUserId).trim().toLowerCase();
  });
  const receivedConnections = Array.isArray(connection.receivedList.data) ? connection.receivedList.data : [];
  const matchingReceived = receivedConnections.find((inv: any) => {
    const senderId = inv?.sender?.id ?? inv?.sender?.userId ?? inv?.senderId ?? inv?.id;
    if (!senderId || !resolvedTargetUserId) return false;
    return String(senderId).trim().toLowerCase() === String(resolvedTargetUserId).trim().toLowerCase();
  });
  const isAlreadyInvited = Boolean(matchingInvitation);
  const isApprovedInvitation =
    matchingInvitation?.status === 'APPROVED' ||
    matchingReceived?.status === 'APPROVED' ||
    String(requestStatus || '').toUpperCase() === 'APPROVED';

  const targetTelegramUsername =
    resolvedProfile?.telegramUsername ||
    profile?.telegramUsername ||
    matchingInvitation?.receiver?.telegramUsername ||
    matchingInvitation?.sender?.telegramUsername ||
    matchingReceived?.sender?.telegramUsername ||
    matchingReceived?.receiver?.telegramUsername ||
    '';

  const resolvedLanguages = (isOwnProfile || propProfile)
    ? normalizeTextValue(resolvedProfile?.language || profile.language, '')
        .split(',')
        .map((lang) => lang.trim())
        .filter((lang) => lang && !hiddenLanguages.has(lang.toLowerCase()))
    : selectedLanguages;
  const visibleLookingFor = normalizeTextValue(
    resolvedProfile?.lookingFor || profile?.lookingFor,
    isOwnProfile
      ? (Array.isArray(selectedLookingFor) ? selectedLookingFor.join(', ') : (selectedLookingFor || 'Relationship'))
      : 'Long-term',
  )
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value && !hiddenLookingForValues.has(value.toLowerCase()))
    .map(capitalizeLabel)
    .join(', ');
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

    const normalizeId = (id: unknown) => String(id ?? '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    if (normalizeId(resolvedTargetUserId) === normalizeId(activeCurrentUserId)) {
      Toast.show({ type: 'error', text1: 'Action not allowed', text2: 'You cannot invite yourself.' });
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

    // Use the verified identity resolved above instead of the hook's initial
    // `currentUserId`, which may be stale after session repair.
    connection.send.mutate({
      senderId: String(activeCurrentUserId),
      receiverId: String(resolvedTargetUserId),
    }, {
      onSuccess: () => {
        connection.sentList.refetch();
        connection.refreshAll();
        Toast.show({ type: 'success', text1: 'Invitation sent!' });
      },
      onError: (error: any) => {
        if (isSubscriptionGateError(error)) {
          setPaywallVisible(true);
          return;
        }
        Toast.show({
          type: 'error',
          text1: 'Invite failed',
          text2: getUserFriendlyMessage(error, 'Please try again in a moment.'),
        });
      },
    });
  };

  const submitReport = (reason: string) => {
      if (!resolvedTargetUserId || !currentUserId) {
        return;
      }

      reportApi.report.mutate({
        byUserId: String(currentUserId),
        targetUserId: String(resolvedTargetUserId),
        reason,
        message: `Reported profile: ${finalDisplayName || 'Unknown user'}`,
      }, {
        onSuccess: () => {
          Toast.show({ type: 'info', text1: 'Profile reported successfully.' });
        },
        onError: () => {
          Toast.show({ type: 'error', text1: 'Report failed', text2: 'Please try again.' });
        },
      });
  };

  const confirmReport = (reason: string) => {
    alert(
      'Confirm Report',
      'Are you sure you want to submit this report? Our safety team will review it.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit Report', style: 'destructive', onPress: () => submitReport(reason) },
      ],
    );
  };

  const handleReport = () => {
      if (!resolvedTargetUserId || !currentUserId) {
        Toast.show({ type: 'error', text1: 'User unavailable' });
        return;
      }

      const normalizeId = (id: unknown) => String(id ?? '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      if (normalizeId(resolvedTargetUserId) === normalizeId(currentUserId)) {
        Toast.show({ type: 'error', text1: 'Action not allowed', text2: 'You cannot report your own profile.' });
        return;
      }

      alert(
          'Report Profile',
          'Choose the reason for reporting this profile.',
          [
              { text: 'Fake profile', onPress: () => setTimeout(() => confirmReport('FAKE_PROFILE'), 0) },
              { text: 'Harassment or abuse', onPress: () => setTimeout(() => confirmReport('HARASSMENT'), 0) },
              { text: 'Inappropriate content', onPress: () => setTimeout(() => confirmReport('INAPPROPRIATE_CONTENT'), 0) },
              { text: 'Spam or scam', onPress: () => setTimeout(() => confirmReport('SPAM_SCAM'), 0) },
              { text: 'Safety concern', onPress: () => setTimeout(() => confirmReport('SAFETY_CONCERN'), 0) },
              { text: 'Cancel', style: 'cancel' },
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
              {resolvedProfile?.bio || profile?.bio || (isOwnProfile ? (profileText || "No bio added yet. Write something about yourself!") : "Looking for meaningful connections.")}
          </Text>
      </View>

      {/* More Info Section */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>More info</Text>
          {isOwnProfile && (
            <TouchableOpacity
              onPress={() => navigation.navigate('MoreInfoScreen')}
              style={styles.editSectionBtn}
              activeOpacity={0.7}
            >
              <Feather name="edit-2" size={13} color={Colors.primary} style={{ marginRight: 4 }} />
              <Text style={styles.editSectionText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.pillsContainer}>
          <DetailPill icon="emoticon-happy-outline" text={capitalizeLabel(normalizeTextValue(resolvedProfile?.appearance || profile?.appearance, isOwnProfile ? (selectedAppearance || "Natural") : "Natural"))} />
          <DetailPill icon="ruler" text={`${normalizeTextValue(resolvedProfile?.height || profile?.height, isOwnProfile ? String(height || '---') : '165')} cm`} />
          <DetailPill icon="human-handsup" text={capitalizeLabel(normalizeTextValue(resolvedProfile?.bodyType || profile?.bodyType, isOwnProfile ? (selectedBodyType || "Average") : "Fit"))} />
          <DetailPill icon="ear-hearing" text={capitalizeLabel(normalizeTextValue(resolvedProfile?.englishLevel || profile?.englishLevel, isOwnProfile ? (englishSkillLevel === 3 ? 'Native' : englishSkillLevel === 2 ? 'Advanced' : englishSkillLevel === 1 ? 'Intermediate' : 'Beginner') : 'Advanced'))} />
          <DetailPill icon="account-outline" text={capitalizeLabel(normalizeTextValue(resolvedProfile?.ethnicity || profile?.ethnicity, isOwnProfile ? (selectedEthinicity || "Not specified") : "Asian"))} />
          <DetailPill icon="smoking" text={`Smoke: ${capitalizeLabel(normalizeTextValue(resolvedProfile?.smoke || profile?.smoke, isOwnProfile ? (selectedSmoking || 'No') : 'Never'))}`} />
          <DetailPill icon="glass-cocktail" text={`Drink: ${capitalizeLabel(normalizeTextValue(resolvedProfile?.drink || profile?.drink, isOwnProfile ? (selectedDrinking || 'No') : 'Socially'))}`} />
          <DetailPill icon="baby-face-outline" text={`Looking for: ${visibleLookingFor || 'Not specified'}`} />
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
                <Text style={styles.pillText}>{capitalizeLabel(lang)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Action Buttons */}
      {!isOwnProfile && (
          <View style={styles.actionSection}>
            {isReceivedPendingRequest ? (
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.inviteBtnWrapper}
                onPress={handleApproveRequest}
                disabled={connection.accept.isPending}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.inviteBtn}
                >
                  {connection.accept.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.inviteText}>Approve Request</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity 
              activeOpacity={0.7} 
              style={styles.reportBtn} 
              onPress={handleReport}
            >
                 <Icon name="alert-octagon-outline" size={18} color="#FF5A79" />
                 <Text style={styles.reportText}>Report / block this profile</Text>
            </TouchableOpacity>

            {isAlreadyInvited && !isApprovedInvitation ? (
              <Text style={styles.pendingInvitationText}>Invitation pending approval</Text>
            ) : isApprovedInvitation ? (
              <View style={styles.approvedTelegramContainer}>
                <View style={styles.approvedTelegramInfoBox}>
                  <Text style={styles.approvedTelegramLabel}>TELEGRAM CONTACT</Text>
                  <Text selectable={true} style={styles.approvedTelegramHandle}>
                    {targetTelegramUsername ? `@${targetTelegramUsername.replace('@', '')}` : 'Not connected'}
                  </Text>
                </View>
                <View style={styles.approvedTelegramBtnRow}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.openTelegramBtn}
                    onPress={() => handleOpenTelegram(targetTelegramUsername)}
                  >
                    <LinearGradient
                      colors={[Colors.primary, Colors.secondary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.telegramGradient}
                    >
                      <Icon name="send" size={18} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={styles.openTelegramBtnText}>Open Telegram</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  {targetTelegramUsername ? (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.shareTelegramBtn}
                      onPress={() => handleShareTelegram(targetTelegramUsername)}
                      accessibilityLabel="Share Telegram Handle"
                    >
                      <Icon name="share-variant-outline" size={20} color={Colors.primary} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.inviteBtnWrapper}
                onPress={handleInvite}
                disabled={!canAttemptInvite || isAlreadyInvited || connection.send.isPending}
              >
                <LinearGradient
                  colors={(!canAttemptInvite || isAlreadyInvited) ? [Colors.textMuted, Colors.textMuted] : [Colors.primary, Colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.inviteBtn}
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
                        {!canAttemptInvite ? "Invite Unavailable" : isAlreadyInvited ? "Connected" : "Invite Now"}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
        </View>
      )}

      <View style={{ height: 60 }} />
      {AlertComponent}
    </View>
  );
};

export default UserDetails;

const createStyles = (isCompactDevice: boolean) => StyleSheet.create({
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
    flexShrink: 1,
  },
  verifiedIcon: {
    marginLeft: 12,
  },
  statusRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 18,
      rowGap: 8,
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
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  editSectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  editSectionText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
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
    width: '100%',
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
    alignSelf: 'flex-start',
    maxWidth: '100%',
    minWidth: 0,
    flexShrink: 1,
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
    flexShrink: 1,
    minWidth: 0,
    lineHeight: isCompactDevice ? 20 : 22,
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
  inviteBtnWrapper: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  inviteBtn: {
    minHeight: isCompactDevice ? 60 : 66,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  inviteIcon: {
    transform: [{ rotate: '-15deg' }],
  },
  inviteText: {
    color: '#fff',
    fontSize: isCompactDevice ? 18 : 20,
    fontWeight: '900',
  },
  recallBtnWrapper: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  recallGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: isCompactDevice ? 60 : 66,
    borderRadius: 18,
    width: '100%',
  },
  recallBtnText: {
    color: '#fff',
    fontSize: isCompactDevice ? 18 : 20,
    fontWeight: '900',
  },
  pendingInvitationText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 12,
  },
  approvedTelegramContainer: {
    width: '100%',
    backgroundColor: 'rgba(124, 58, 237, 0.06)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.15)',
    marginBottom: 8,
  },
  approvedTelegramInfoBox: {
    alignItems: 'center',
    marginBottom: 12,
  },
  approvedTelegramLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  approvedTelegramHandle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  approvedTelegramBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  openTelegramBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  telegramGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  openTelegramBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  shareTelegramBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.25)',
  },
});
