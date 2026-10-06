import React, { useContext, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import Feather from 'react-native-vector-icons/Feather';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useConnection } from '../../../api/useConnection';
import { useReport } from '../../../api/useReport';
import AppContext from '../../../context/CreateGlobalStateContext';
import { Colors, useTheme } from '../../../theme';
import { isResolvedApiUserId, repairStoredSessionIdentity } from '../../../utils/session';
import { getAuthToken } from '../../../utils/sessionHelper';
import { getUserFriendlyMessage, isSubscriptionGateError } from '../../../utils/userFriendlyMessages';
import { useAlert } from '../../../components/AlertModal';

const REPORT_REASONS = [
  'Scam / Fraud',
  'Fake profile',
  'Harassment',
  'Abusive language',
  'Sexual harassment',
  "Didn't show up",
  'Soliciting',
  'Appears to be underage',
  'Extortion / Threats',
  'Shared my contact',
  'Sent unsolicited content',
  'Wrong gender shown',
  'Multiple accounts',
  'Other',
];

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
  const { themeColors, isDark } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const isCompactDevice = windowWidth < 380;
  const styles = useMemo(() => createStyles(themeColors, isCompactDevice), [themeColors, isCompactDevice]);

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

  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportStep, setReportStep] = useState<'INITIAL' | 'REASONS'>('INITIAL');
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [isReasonExpanded, setIsReasonExpanded] = useState(true);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [evidencePhotos, setEvidencePhotos] = useState<string[]>([]);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const handleOpenReportModal = () => {
    if (!resolvedTargetUserId || !currentUserId) {
      Toast.show({ type: 'error', text1: 'User unavailable' });
      return;
    }

    const normalizeId = (id: unknown) => String(id ?? '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    if (normalizeId(resolvedTargetUserId) === normalizeId(currentUserId)) {
      Toast.show({ type: 'error', text1: 'Action not allowed', text2: 'You cannot report your own profile.' });
      return;
    }

    setReportStep('INITIAL');
    setSelectedReason(null);
    setAdditionalDetails('');
    setEvidencePhotos([]);
    setIsReasonExpanded(true);
    setIsDetailsExpanded(false);
    setReportModalVisible(true);
  };

  const handleBlockOnly = () => {
    setReportModalVisible(false);
    Toast.show({
      type: 'success',
      text1: 'User blocked',
      text2: 'This user has been blocked.',
    });
    navigation.goBack();
  };

  const handlePickEvidencePhoto = async (slotIndex: number) => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 1,
      });
      if (result.assets && result.assets.length > 0 && result.assets[0].uri) {
        const newPhotos = [...evidencePhotos];
        newPhotos[slotIndex] = result.assets[0].uri;
        setEvidencePhotos(newPhotos);
      }
    } catch (err) {
      console.warn('Evidence photo pick error:', err);
    }
  };

  const handleRemoveEvidencePhoto = (slotIndex: number) => {
    const newPhotos = [...evidencePhotos];
    newPhotos.splice(slotIndex, 1);
    setEvidencePhotos(newPhotos);
  };

  const handleSelectReason = (reason: string) => {
    setSelectedReason(reason);
    setIsReasonExpanded(false);
    setIsDetailsExpanded(true);
  };

  const handleReportAndBlock = () => {
    if (!selectedReason) {
      Toast.show({ type: 'error', text1: 'Please select a reason' });
      return;
    }
    setIsSubmittingReport(true);
    reportApi.report.mutate(
      {
        byUserId: String(currentUserId),
        targetUserId: String(resolvedTargetUserId),
        reason: selectedReason,
        message: additionalDetails.trim()
          ? `Reported: ${finalDisplayName || 'User'}. Reason: ${selectedReason}. Details: ${additionalDetails.trim()}`
          : `Reported: ${finalDisplayName || 'User'}. Reason: ${selectedReason}.`,
      },
      {
        onSuccess: () => {
          setIsSubmittingReport(false);
          setReportModalVisible(false);
          Toast.show({
            type: 'success',
            text1: 'Report submitted',
            text2: 'Thank you. The user has been reported and blocked.',
          });
          navigation.goBack();
        },
        onError: (err: any) => {
          setIsSubmittingReport(false);
          Toast.show({
            type: 'error',
            text1: 'Report failed',
            text2: getUserFriendlyMessage(err, 'Unable to submit report. Please try again.'),
          });
        },
      }
    );
  };

  const DetailPill = ({ icon, text }: { icon?: string; text: string }) => (
    <View style={styles.pill}>
      {icon ? <Icon name={icon} size={16} color={Colors.textSecondary} style={styles.pillIcon} /> : null}
      <Text style={styles.pillText}>{text}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={styles.headerArea}>
        <View style={styles.nameRow}>
          <Text style={styles.nameText}>{finalDisplayName || "User"}, {displayAge}</Text>
          <View style={styles.verifiedBadge}>
            <Icon name="check-decagram-outline" size={16} color={Colors.primaryLight} style={styles.verifiedIcon} />
            <Text style={styles.verifiedText}>You're verified by photo!</Text>
          </View>
        </View>

        <Text style={styles.bioText}>
          {resolvedProfile?.bio || profile?.bio || (isOwnProfile ? (profileText || "I am good enough for every good thing you can imagine..") : "Looking for meaningful connections.")}
        </Text>
      </View>

      {/* About Me / Details Section */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>About me</Text>
          {isOwnProfile && (
            <TouchableOpacity
              onPress={() => navigation.navigate('MoreInfoScreen')}
              style={styles.editSectionBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.editSectionText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.pillsContainer}>
          <DetailPill icon="tape-measure" text={`${normalizeTextValue(resolvedProfile?.height || profile?.height, isOwnProfile ? String(height || '171') : '171')} cm`} />
          <DetailPill icon="account-outline" text={capitalizeLabel(normalizeTextValue(resolvedProfile?.bodyType || profile?.bodyType, isOwnProfile ? (selectedBodyType || "Slim") : "Slim"))} />
          <DetailPill icon="emoticon-outline" text={capitalizeLabel(normalizeTextValue(resolvedProfile?.appearance || profile?.appearance, isOwnProfile ? (selectedAppearance || "Attractive") : "Attractive"))} />
          <DetailPill icon="account-group-outline" text={capitalizeLabel(normalizeTextValue(resolvedProfile?.ethnicity || profile?.ethnicity, isOwnProfile ? (selectedEthinicity || "Asian") : "Asian"))} />
          <DetailPill icon="smoking" text={capitalizeLabel(normalizeTextValue(resolvedProfile?.smoke || profile?.smoke, isOwnProfile ? (selectedSmoking || 'Sometimes') : 'Sometimes'))} />
          <DetailPill text={`English Fluency: ${capitalizeLabel(normalizeTextValue(resolvedProfile?.englishLevel || profile?.englishLevel, isOwnProfile ? (englishSkillLevel === 3 ? 'Native' : englishSkillLevel === 2 ? 'Advanced' : englishSkillLevel === 1 ? 'Intermediate' : 'Basic') : 'Basic'))}`} />
          <DetailPill icon="baby-face-outline" text={`Kids: ${normalizeTextValue(resolvedProfile?.kids || profile?.kids, "Prefer not to say")}`} />
          <DetailPill icon="currency-usd" text={normalizeTextValue(resolvedProfile?.netWorth || profile?.netWorth, "Below 50k")} />
        </View>
      </View>

      {/* Languages Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Languages</Text>
        <View style={styles.pillsContainer}>
          {(resolvedLanguages && resolvedLanguages.length > 0 ? resolvedLanguages : ['English']).map((lang: string) => (
            <View key={lang} style={styles.pill}>
              <Text style={styles.flagEmoji}>🇬🇧</Text>
              <Text style={styles.pillText}>{capitalizeLabel(lang)}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Looking For Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Looking for</Text>
        <View style={styles.pillsContainer}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>{visibleLookingFor || 'Relationship'}</Text>
          </View>
        </View>
      </View>

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
                  colors={[Colors.primary, Colors.primaryLight]}
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
              onPress={handleOpenReportModal}
            >
                 <Feather name="alert-triangle" size={16} color={themeColors.textSecondary || '#94A3B8'} style={{ marginRight: 2 }} />
                 <Text style={styles.reportText}>Report this profile</Text>
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
                      colors={[Colors.primary, Colors.primaryLight]}
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
                      <Icon name="share-variant-outline" size={20} color={Colors.primaryLight} />
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
                  colors={(!canAttemptInvite || isAlreadyInvited) ? [Colors.disabled, Colors.disabled] : [Colors.primary, Colors.primaryLight]}
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

      {/* Report & Block 2-Step Modal */}
      <Modal
        visible={reportModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.reportModalOverlay}>
          <View style={styles.reportModalCard}>
            {reportStep === 'INITIAL' ? (
              <View>
                <Text style={styles.reportModalTitle}>Report and block this user</Text>
                
                <Text style={styles.reportModalParagraph}>
                  We are committed to maintaining a safe and respectful community. If you have experienced any issues or inappropriate behavior with this user, please report them to us.
                </Text>

                <Text style={styles.reportModalParagraph}>
                  Blocking this user will prevent them from seeing your profile or contacting you on Amara.
                </Text>

                <Text style={styles.reportModalParagraph}>
                  To help us take appropriate action, please provide as much detail as possible about why you are reporting this user.
                </Text>

                <Text style={styles.reportModalParagraph}>
                  Thank you for helping us keep Amara a safe and welcoming space for everyone.
                </Text>

                <View style={styles.reportBtnStack}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.blockOnlyBtn}
                    onPress={handleBlockOnly}
                  >
                    <Text style={styles.blockOnlyBtnText}>Block only</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.coralPillBtn}
                    onPress={() => setReportStep('REASONS')}
                  >
                    <Text style={styles.coralPillBtnText}>Report & Block</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.modalCancelBtn}
                    onPress={() => setReportModalVisible(false)}
                  >
                    <Text style={styles.modalCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={{ maxHeight: '90%' }}>
                <Text style={styles.reportModalTitle}>Why are you reporting?</Text>

                <ScrollView showsVerticalScrollIndicator={false} style={styles.reportScrollArea}>
                  {/* Reason Accordion */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.accordionHeader}
                    onPress={() => setIsReasonExpanded(!isReasonExpanded)}
                  >
                    <View style={styles.accordionHeaderLeft}>
                      <Text style={styles.accordionTitle}>Reason</Text>
                      {selectedReason && (
                        <Text style={styles.accordionSelectedReasonText} numberOfLines={1}>
                          ✓ {selectedReason}
                        </Text>
                      )}
                    </View>
                    <Feather
                      name={isReasonExpanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={themeColors.textSecondary || '#94A3B8'}
                    />
                  </TouchableOpacity>

                  {isReasonExpanded && (
                    <View style={styles.reasonsList}>
                      {REPORT_REASONS.map((reason, index) => {
                        const isSelected = selectedReason === reason;
                        return (
                          <TouchableOpacity
                            key={reason}
                            activeOpacity={0.7}
                            style={[
                              styles.reasonRow,
                              index === REPORT_REASONS.length - 1 && { borderBottomWidth: 0 },
                            ]}
                            onPress={() => handleSelectReason(reason)}
                          >
                            <Text
                              style={[
                                styles.reasonText,
                                isSelected && styles.reasonTextSelected,
                              ]}
                            >
                              {reason}
                            </Text>
                            {isSelected && (
                              <Feather name="check" size={18} color="#EF4444" />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  {/* Additional Details Accordion */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.accordionHeader, { marginTop: 12 }]}
                    onPress={() => setIsDetailsExpanded(!isDetailsExpanded)}
                  >
                    <Text style={styles.accordionTitle}>Additional details</Text>
                    <Feather
                      name={isDetailsExpanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={themeColors.textSecondary || '#94A3B8'}
                    />
                  </TouchableOpacity>

                  {isDetailsExpanded && (
                    <View style={styles.detailsContentWrap}>
                      <View style={styles.detailsInputBox}>
                        <TextInput
                          style={styles.detailsInput}
                          multiline={true}
                          numberOfLines={3}
                          maxLength={1023}
                          placeholder="Description"
                          placeholderTextColor={themeColors.placeholder || '#94A3B8'}
                          value={additionalDetails}
                          onChangeText={setAdditionalDetails}
                          textAlignVertical="top"
                        />
                      </View>
                      <Text style={styles.charCountText}>
                        {additionalDetails.length} / 1023
                      </Text>

                      <Text style={styles.evidencePhotosTitle}>
                        Evidence photos (optional)
                      </Text>

                      <View style={styles.photoSlotsRow}>
                        {[0, 1, 2].map((slotIndex) => {
                          const photoUri = evidencePhotos[slotIndex];
                          return (
                            <TouchableOpacity
                              key={`evidence-slot-${slotIndex}`}
                              activeOpacity={0.8}
                              style={styles.evidenceSlot}
                              onPress={() => handlePickEvidencePhoto(slotIndex)}
                            >
                              {photoUri ? (
                                <View style={styles.evidenceImageWrapper}>
                                  <Image
                                    source={{ uri: photoUri }}
                                    style={styles.evidenceImage}
                                    resizeMode="cover"
                                  />
                                  <TouchableOpacity
                                    style={styles.evidenceDeleteBadge}
                                    onPress={() => handleRemoveEvidencePhoto(slotIndex)}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                  >
                                    <Feather name="x" size={11} color="#FFFFFF" />
                                  </TouchableOpacity>
                                </View>
                              ) : (
                                <View style={styles.evidenceSlotEmpty}>
                                  <Feather
                                    name="camera"
                                    size={24}
                                    color={themeColors.textMuted || '#94A3B8'}
                                  />
                                  <View style={styles.evidencePlusBadge}>
                                    <Feather name="plus" size={12} color={themeColors.textMuted || '#64748B'} />
                                  </View>
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </ScrollView>

                <View style={[styles.reportBtnStack, { marginTop: 16 }]}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[
                      styles.coralPillBtn,
                      !selectedReason && { opacity: 0.5 },
                    ]}
                    onPress={handleReportAndBlock}
                    disabled={!selectedReason || isSubmittingReport}
                  >
                    {isSubmittingReport ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.coralPillBtnText}>Report & Block</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.modalCancelBtn}
                    onPress={() => setReportStep('INITIAL')}
                  >
                    <Text style={styles.modalCancelBtnText}>Back</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <View style={{ height: 40 }} />
      {AlertComponent}
    </View>
  );
};

export default UserDetails;

const createStyles = (colors: any, isCompactDevice: boolean) => StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    backgroundColor: colors.background,
    paddingTop: 16,
  },
  headerArea: {
    marginBottom: 20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  nameText: {
    fontSize: isCompactDevice ? 20 : 23,
    fontWeight: '800',
    color: colors.text,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedIcon: {
    marginRight: 2,
  },
  verifiedText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.primaryLight,
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: isCompactDevice ? 17 : 18.5,
    fontWeight: '800',
    color: colors.text,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  editSectionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 7,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editSectionText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.white || '#FFFFFF',
  },
  bioText: {
    fontSize: isCompactDevice ? 14.5 : 15,
    color: colors.textSecondary,
    lineHeight: 22,
    fontWeight: '400',
    marginTop: 10,
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 22,
    paddingHorizontal: isCompactDevice ? 12 : 14,
    paddingVertical: 8.5,
  },
  pillIcon: {
    marginRight: 6,
  },
  flagEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  pillText: {
    fontSize: isCompactDevice ? 13.5 : 14,
    color: colors.text,
    fontWeight: '500',
  },
  actionSection: {
    gap: 16,
    marginTop: 15,
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 8,
  },
  reportText: {
    color: colors.textMuted,
    fontSize: 14.5,
    fontWeight: '600',
  },
  inviteBtnWrapper: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  inviteBtn: {
    minHeight: isCompactDevice ? 56 : 60,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
  },
  inviteIcon: {
    transform: [{ rotate: '-15deg' }],
  },
  inviteText: {
    color: '#fff',
    fontSize: isCompactDevice ? 17 : 18,
    fontWeight: '800',
  },
  recallBtnWrapper: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  recallGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: isCompactDevice ? 56 : 60,
    borderRadius: 16,
    width: '100%',
  },
  recallBtnText: {
    color: '#fff',
    fontSize: isCompactDevice ? 17 : 18,
    fontWeight: '800',
  },
  pendingInvitationText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 12,
  },
  approvedTelegramContainer: {
    width: '100%',
    backgroundColor: colors.surfaceLight,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginBottom: 8,
  },
  approvedTelegramInfoBox: {
    alignItems: 'center',
    marginBottom: 12,
  },
  approvedTelegramLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  approvedTelegramHandle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
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
    paddingVertical: 13,
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
    backgroundColor: colors.surfaceLighter,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  reportModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  reportModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface || '#161622',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.glassBorder || 'rgba(255, 255, 255, 0.08)',
  },
  reportModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  reportModalParagraph: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  reportBtnStack: {
    gap: 12,
    marginTop: 16,
    width: '100%',
  },
  blockOnlyBtn: {
    width: '100%',
    minHeight: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.border || colors.glassBorder,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockOnlyBtnText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  coralPillBtn: {
    width: '100%',
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: '#F87171',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coralPillBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalCancelBtn: {
    width: '100%',
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  reportScrollArea: {
    maxHeight: 340,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.surfaceLight,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border || colors.glassBorder,
  },
  accordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  accordionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  accordionSelectedReasonText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
    flex: 1,
  },
  reasonsList: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 14,
    marginTop: 6,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border || colors.glassBorder,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider || colors.border || 'rgba(128, 128, 128, 0.15)',
  },
  reasonText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
  reasonTextSelected: {
    color: '#EF4444',
    fontWeight: '700',
  },
  detailsContentWrap: {
    marginTop: 10,
  },
  detailsInputBox: {
    backgroundColor: colors.inputBackground || colors.surfaceLight,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border || colors.glassBorder,
  },
  detailsInput: {
    color: colors.text,
    fontSize: 14,
    minHeight: 70,
  },
  charCountText: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
    marginBottom: 12,
  },
  evidencePhotosTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 10,
  },
  photoSlotsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  evidenceSlot: {
    flex: 1,
    height: 105,
    borderRadius: 14,
    backgroundColor: colors.inputBackground || colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border || colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  evidenceSlotEmpty: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  evidencePlusBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  evidenceImageWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  evidenceImage: {
    width: '100%',
    height: '100%',
  },
  evidenceDeleteBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});


