import React, { useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { getAuthToken, getUserId } from '../../../utils/sessionHelper';
import { getUserFriendlyMessage, isSubscriptionGateError } from '../../../utils/userFriendlyMessages';
import { useAlert } from '../../../components/AlertModal';
import { openTelegramChat } from '../../../utils/telegramHelper';
import { getLanguageFlag } from '../../../utils/languageHelper';
import { t, useTranslation } from '../../../i18n';
import { saveBlockedUser } from '../../../utils/types/AsyncStorage';

const getReportReasons = () => [
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
  t('profile.userdetails.other'),
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
  useTranslation();
  const hiddenLanguages = new Set(['telugu']);
  const hiddenLookingForValues = new Set([t('profile.userdetails.long_term_relationship')]);
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
    selectedNetWorth,
    selectedKids,
  } = useContext(AppContext);

  const [localNetWorth, setLocalNetWorth] = useState<string | null>(null);
  const [localKids, setLocalKids] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem('@amara_net_worth').then((val) => {
      if (isMounted && val) setLocalNetWorth(val);
    });
    AsyncStorage.getItem('@amara_kid_count').then((val) => {
      if (isMounted && val) setLocalKids(val);
    });
    return () => {
      isMounted = false;
    };
  }, [selectedNetWorth, selectedKids]);

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
        alert(t('profile.userdetails.request_approved'), t('profile.userdetails.this_connection_is_approved_telegram_contact_is'), [
          { text: t('profile.userdetails.done'), onPress: () => navigation.goBack() },
        ]);
      },
      onError: (error: any) => {
        alert(t('profile.userdetails.couldnt_approve_invitation'), getUserFriendlyMessage(error, t('profile.userdetails.we_could_not_approve_this_invitation_right_now')));
      },
    });
  };

  const handleOpenTelegram = (username?: string) => {
    openTelegramChat(username);
  };

  const handleShareTelegram = async (username?: string) => {
    if (!username) {
      alert(t('profile.userdetails.telegram_not_connected'), t('profile.userdetails.no_username_available_to_share'));
      return;
    }
    const cleanUsername = username.replace('@', '');
    try {
      await Share.share({
        message: t('profile.userdetails.https_t_me', { cleanUsername }),
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
      return value ? t('profile.userdetails.yes') : t('profile.userdetails.no');
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
          t('home.usercard.user')
        )
      : normalizeTextValue(
          resolvedProfile?.name ||
            resolvedProfile?.displayName ||
            profile.name ||
            profile.displayName ||
            cardUserName,
          t('home.usercard.user')
        )
  ).replace(/,\s*\d+$/, '').trim() || t('home.usercard.user');

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
      ? (Array.isArray(selectedLookingFor) ? selectedLookingFor.join(', ') : (selectedLookingFor || t('profile.userdetails.relationship')))
      : t('profile.viewmyprofilescreen.long_term'),
  )
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value && !hiddenLookingForValues.has(value.toLowerCase()))
    .map(capitalizeLabel)
    .join(', ');
  const locationText = normalizeTextValue(
    resolvedProfile?.currentCity || profile?.currentCity,
    isOwnProfile ? t('profile.userdetails.your_location') : t('home.usercard.nearby')
  );
  const distanceRaw = resolvedProfile?.distance || profile?.distance;
  const distanceText = distanceRaw
    ? (String(distanceRaw).toLowerCase().includes('away') ? String(distanceRaw) : t('home.usercard.away', { trimmed: distanceRaw }))
    : '21 km away';
  const cityText = normalizeTextValue(
    resolvedProfile?.currentCity || profile?.currentCity,
    'Dattatreya Ward, Bengaluru'
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
        text1: t('profile.userdetails.user_unavailable'),
        text2: t('profile.userdetails.this_profile_cannot_be_invited_right_now'),
      });
      return;
    }

    if (!activeCurrentUserId) {
      const token = await getAuthToken();
      Toast.show({
        type: 'error',
        text1: t('profile.userdetails.account_sync_needed'),
        text2: token
          ? t('profile.userdetails.your_login_is_missing_a_valid_account_id_from_the_server')
          : t('profile.userdetails.please_log_in_again_and_try_once_more'),
      });
      return;
    }

    const normalizeId = (id: unknown) => String(id ?? '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    if (normalizeId(resolvedTargetUserId) === normalizeId(activeCurrentUserId)) {
      Toast.show({ type: 'error', text1: t('profile.userdetails.action_not_allowed'), text2: t('profile.userdetails.you_cannot_invite_yourself') });
      return;
    }

    if (isAlreadyInvited) {
        Toast.show({ type: 'info', text1: t('profile.userdetails.already_invited') });
        return;
    }

    const inviteData = {
        receiverId: resolvedTargetUserId,
        name: finalDisplayName || t('profile.userdetails.guest'),
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
        Toast.show({ type: 'success', text1: t('profile.userdetails.invitation_sent') });
      },
      onError: (error: any) => {
        if (isSubscriptionGateError(error)) {
          setPaywallVisible(true);
          return;
        }
        Toast.show({
          type: 'error',
          text1: t('profile.userdetails.invite_failed'),
          text2: getUserFriendlyMessage(error, t('profile.userdetails.please_try_again_in_a_moment')),
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

  const handleOpenReportModal = async () => {
    let activeBy = currentUserId ? String(currentUserId).trim() : '';
    if (!activeBy || activeBy === 'undefined' || activeBy === 'null') {
      activeBy = String((await getUserId()) || (await repairStoredSessionIdentity()) || '');
    }

    if (!resolvedTargetUserId || !activeBy) {
      Toast.show({ type: 'error', text1: t('profile.userdetails.user_unavailable') });
      return;
    }

    const normalizeId = (id: unknown) => String(id ?? '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    if (normalizeId(resolvedTargetUserId) === normalizeId(activeBy)) {
      Toast.show({ type: 'error', text1: t('profile.userdetails.action_not_allowed'), text2: t('profile.userdetails.you_cannot_report_your_own_profile') });
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

  const handleBlockOnly = async () => {
    let activeBy = currentUserId ? String(currentUserId).trim() : '';
    if (!activeBy || activeBy === 'undefined' || activeBy === 'null') {
      activeBy = String((await getUserId()) || (await repairStoredSessionIdentity()) || '');
    }

    const activeTarget = resolvedTargetUserId ? String(resolvedTargetUserId).trim() : '';
    if (activeTarget && activeBy) {
      await saveBlockedUser(activeBy, activeTarget);
      try {
        await reportApi.block.mutateAsync({ byUserId: activeBy, targetUserId: activeTarget });
      } catch (err) {
        console.warn('Block request warning:', err);
      }
    }

    setReportModalVisible(false);
    Toast.show({
      type: 'success',
      text1: t('profile.userdetails.user_blocked'),
      text2: t('profile.userdetails.this_user_has_been_blocked'),
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

  const handleReportAndBlock = async () => {
    if (!selectedReason) {
      Toast.show({ type: 'error', text1: t('profile.userdetails.please_select_a_reason') });
      return;
    }

    let activeBy = currentUserId ? String(currentUserId).trim() : '';
    if (!activeBy || activeBy === 'undefined' || activeBy === 'null') {
      activeBy = String((await getUserId()) || (await repairStoredSessionIdentity()) || '');
    }

    const activeTarget = resolvedTargetUserId ? String(resolvedTargetUserId).trim() : '';
    if (!activeTarget || activeTarget === 'undefined' || activeTarget === 'null') {
      Toast.show({ type: 'error', text1: t('profile.userdetails.target_user_unavailable') });
      return;
    }

    if (activeTarget && activeBy) {
      await saveBlockedUser(activeBy, activeTarget);
    }

    setIsSubmittingReport(true);
    reportApi.report.mutate(
      {
        byUserId: activeBy,
        targetUserId: activeTarget,
        reason: selectedReason,
        message: additionalDetails.trim()
          ? t('profile.userdetails.reported_reason_details', { finalDisplayName: finalDisplayName || t('home.usercard.user'), selectedReason, additionalDetails: additionalDetails.trim() })
          : t('profile.userdetails.reported_reason', { finalDisplayName: finalDisplayName || t('home.usercard.user'), selectedReason }),
      },
      {
        onSuccess: () => {
          setIsSubmittingReport(false);
          setReportModalVisible(false);
          Toast.show({
            type: 'success',
            text1: t('profile.userdetails.report_submitted'),
            text2: t('profile.userdetails.thank_you_the_user_has_been_reported_and_blocked'),
          });
          navigation.goBack();
        },
        onError: (err: any) => {
          setIsSubmittingReport(false);
          Toast.show({
            type: 'error',
            text1: t('profile.userdetails.report_failed'),
            text2: getUserFriendlyMessage(err, t('profile.userdetails.unable_to_submit_report_please_try_again')),
          });
        },
      }
    );
  };

  const DetailPill = ({ icon, text }: { icon?: string; text: string }) => (
    <View style={styles.pill}>
      {icon ? <Icon name={icon} size={16} color={themeColors.textSecondary || Colors.textSecondary} style={styles.pillIcon} /> : null}
      <Text style={styles.pillText}>{text}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={styles.headerArea}>
        <View style={styles.nameRow}>
          <Text style={styles.nameText}>{finalDisplayName || t('home.usercard.user')}, {displayAge}</Text>
          {isOwnProfile ? (
            <View style={styles.verifiedBadge}>
              <Icon name="check-decagram-outline" size={16} color={Colors.primaryLight} style={styles.verifiedIcon} />
              <Text style={styles.verifiedText}>{t('profile.userdetails.youre_verified_by_photo')}</Text>
            </View>
          ) : (
            <Icon name="check-circle" size={19} color={themeColors.primary || '#7C3AED'} style={{ marginLeft: 6 }} />
          )}
        </View>

        {!isOwnProfile && (
          <View style={styles.metaInfoRow}>
            <View style={styles.metaItem}>
              <Icon name="clock-outline" size={15} color={themeColors.textSecondary || '#94A3B8'} style={styles.metaIcon} />
              <Text style={styles.metaText}>{t('profile.userdetails.active_today')}</Text>
            </View>
            <View style={styles.metaItem}>
              <Icon name="map-marker-outline" size={15} color={themeColors.textSecondary || '#94A3B8'} style={styles.metaIcon} />
              <Text style={styles.metaText}>{distanceText}</Text>
            </View>
            <View style={styles.metaItem}>
              <Icon name="office-building-outline" size={15} color={themeColors.textSecondary || '#94A3B8'} style={styles.metaIcon} />
              <Text style={styles.metaText} numberOfLines={1}>{cityText}</Text>
            </View>
          </View>
        )}

        <View style={styles.bioBlock}>
          <Text style={styles.sectionTitle}>{t('more_info.header.about_me')}</Text>
          <Text style={styles.bioText}>
            {resolvedProfile?.bio || profile?.bio || (isOwnProfile ? (profileText || t('profile.userdetails.i_am_good_enough_for_every_good_thing_you_can_imagine')) : "Dm for vc only")}
          </Text>
        </View>
      </View>

      {/* Details Section */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>{t('profile.userdetails.details')}</Text>
          {isOwnProfile && (
            <TouchableOpacity
              onPress={() => navigation.navigate('MoreInfoScreen')}
              style={styles.editSectionBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.editSectionText}>{t('profile.userdetails.edit')}</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.pillsContainer}>
          <DetailPill icon="tape-measure" text={t('more_info.heightselector.cm', { currentHeight: normalizeTextValue(resolvedProfile?.height || profile?.height, isOwnProfile ? String(height || '160') : '160') })} />
          <DetailPill icon="account-outline" text={capitalizeLabel(normalizeTextValue(resolvedProfile?.bodyType || profile?.bodyType, isOwnProfile ? (selectedBodyType || t('profile.userdetails.slim')) : t('profile.userdetails.slim')))} />
          <DetailPill icon="emoticon-happy-outline" text={capitalizeLabel(normalizeTextValue(resolvedProfile?.appearance || profile?.appearance, isOwnProfile ? (selectedAppearance || t('profile.userdetails.attractive')) : t('profile.userdetails.attractive')))} />
          <DetailPill icon="account-multiple-outline" text={capitalizeLabel(normalizeTextValue(resolvedProfile?.ethnicity || profile?.ethnicity, isOwnProfile ? (selectedEthinicity || t('profile.userdetails.other')) : t('profile.userdetails.other')))} />
          <DetailPill icon="smoking" text={capitalizeLabel(normalizeTextValue(resolvedProfile?.smoke || profile?.smoke, isOwnProfile ? (selectedSmoking || t('profile.userdetails.no')) : t('profile.userdetails.no')))} />
          <DetailPill text={t('profile.userdetails.english_fluency', { capitalizeLabel: capitalizeLabel(normalizeTextValue(resolvedProfile?.englishLevel || profile?.englishLevel, isOwnProfile ? (englishSkillLevel === 3 ? 'Native' : englishSkillLevel === 2 ? 'Advanced' : englishSkillLevel === 1 ? 'Intermediate' : 'Medium') : 'Medium')) })} />
          <DetailPill
            icon="baby-face-outline"
            text={t('profile.userdetails.kids', {
              normalizeTextValue: normalizeTextValue(
                resolvedProfile?.kids || resolvedProfile?.kidCount || profile?.kids || profile?.kidCount,
                isOwnProfile ? (selectedKids || localKids || "0") : "0"
              ),
            })}
          />
          {Boolean(resolvedProfile?.netWorth || profile?.netWorth || (isOwnProfile && (selectedNetWorth || localNetWorth))) ? (
            <DetailPill
              icon="currency-usd"
              text={normalizeTextValue(
                resolvedProfile?.netWorth || profile?.netWorth,
                isOwnProfile ? (selectedNetWorth || localNetWorth || "Below 50k") : "Below 50k"
              )}
            />
          ) : null}
        </View>
      </View>

      {/* Languages Section */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>{t('profile.userdetails.languages')}</Text>
        </View>
        <View style={styles.pillsContainer}>
          {(resolvedLanguages && resolvedLanguages.length > 0 ? resolvedLanguages : [t('profile.userdetails.english')]).map((lang: string) => (
            <View key={lang} style={styles.pill}>
              <Text style={styles.flagEmoji}>{getLanguageFlag(lang)}</Text>
              <Text style={styles.pillText}>{capitalizeLabel(lang)}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Looking For Section */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>{t('profile.userdetails.looking_for')}</Text>
        </View>
        <View style={styles.pillsContainer}>
          {(visibleLookingFor ? visibleLookingFor.split(',').map((item) => item.trim()).filter(Boolean) : [t('profile.userdetails.casual_dating')]).map((item) => (
            <View key={item} style={styles.pill}>
              <Icon name="heart-outline" size={16} color={themeColors.primary || Colors.primary} style={styles.pillIcon} />
              <Text style={styles.pillText}>{item}</Text>
            </View>
          ))}
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
                    <Text style={styles.inviteText}>{t('profile.userdetails.approve_request')}</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity 
              activeOpacity={0.7} 
              style={styles.reportBtn} 
              onPress={handleOpenReportModal}
            >
              <Feather name="alert-triangle" size={16} color={themeColors.textSecondary || '#94A3B8'} style={{ marginRight: 6 }} />
              <Text style={styles.reportText}>{t('profile.userdetails.report_this_profile')}</Text>
            </TouchableOpacity>

            {isAlreadyInvited && !isApprovedInvitation ? (
              <Text style={styles.pendingInvitationText}>{t('profile.userdetails.invitation_pending_approval')}</Text>
            ) : isApprovedInvitation ? (
              <View style={styles.approvedTelegramContainer}>
                <View style={styles.approvedTelegramInfoBox}>
                  <Text style={styles.approvedTelegramLabel}>{t('profile.userdetails.telegram_contact')}</Text>
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
                      <Text style={styles.openTelegramBtnText}>{t('profile.userdetails.open_telegram')}</Text>
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
            ) : null}
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
                <Text style={styles.reportModalTitle}>{t('profile.userdetails.report_and_block_this_user')}</Text>
                
                <Text style={styles.reportModalParagraph}>{t('profile.userdetails.we_are_committed_to_maintaining_a_safe_and_respectful_community_if_you')}</Text>

                <Text style={styles.reportModalParagraph}>{t('profile.userdetails.blocking_this_user_will_prevent_them_from_seeing_your_profile_or_conta')}</Text>

                <Text style={styles.reportModalParagraph}>{t('profile.userdetails.to_help_us_take_appropriate_action_please_provide_as_much_detail_as_po')}</Text>

                <Text style={styles.reportModalParagraph}>{t('profile.userdetails.thank_you_for_helping_us_keep_amara_a_safe_and_welcoming_space_for_eve')}</Text>

                <View style={styles.reportBtnStack}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.blockOnlyBtn}
                    onPress={handleBlockOnly}
                  >
                    <Text style={styles.blockOnlyBtnText}>{t('profile.userdetails.block_only')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.coralPillBtn}
                    onPress={() => setReportStep('REASONS')}
                  >
                    <Text style={styles.coralPillBtnText}>{t('profile.userdetails.report_block')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.modalCancelBtn}
                    onPress={() => setReportModalVisible(false)}
                  >
                    <Text style={styles.modalCancelBtnText}>{t('profile.additionaluploadsection.cancel')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={{ maxHeight: '90%' }}>
                <Text style={styles.reportModalTitle}>{t('profile.userdetails.why_are_you_reporting')}</Text>

                <ScrollView showsVerticalScrollIndicator={false} style={styles.reportScrollArea}>
                  {/* Reason Accordion */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.accordionHeader}
                    onPress={() => setIsReasonExpanded(!isReasonExpanded)}
                  >
                    <View style={styles.accordionHeaderLeft}>
                      <Text style={styles.accordionTitle}>{t('profile.userdetails.reason')}</Text>
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
                      {getReportReasons().map((reason, index) => {
                        const isSelected = selectedReason === reason;
                        return (
                          <TouchableOpacity
                            key={reason}
                            activeOpacity={0.7}
                            style={[
                              styles.reasonRow,
                              index === getReportReasons().length - 1 && { borderBottomWidth: 0 },
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
                    <Text style={styles.accordionTitle}>{t('profile.userdetails.additional_details')}</Text>
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
                          placeholder={t('profile.userdetails.description')}
                          placeholderTextColor={themeColors.placeholder || '#94A3B8'}
                          value={additionalDetails}
                          onChangeText={setAdditionalDetails}
                          textAlignVertical="top"
                        />
                      </View>
                      <Text style={styles.charCountText}>
                        {additionalDetails.length} / 1023
                      </Text>

                      <Text style={styles.evidencePhotosTitle}>{t('profile.userdetails.evidence_photos_optional')}</Text>

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
                      <Text style={styles.coralPillBtnText}>{t('profile.userdetails.report_block')}</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.modalCancelBtn}
                    onPress={() => setReportStep('INITIAL')}
                  >
                    <Text style={styles.modalCancelBtnText}>{t('profile.userdetails.back')}</Text>
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
  metaInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
    marginBottom: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    marginRight: 4,
  },
  metaText: {
    fontSize: 13,
    color: colors.textSecondary || '#94A3B8',
    fontWeight: '500',
  },
  bioBlock: {
    marginTop: 10,
    marginBottom: 4,
  },
  section: {
    marginBottom: 28,
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
    marginBottom: 14,
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
    gap: 10,
    width: '100%',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 24,
    paddingHorizontal: isCompactDevice ? 14 : 16,
    paddingVertical: 9.5,
  },
  pillIcon: {
    marginRight: 7,
  },
  flagEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  pillText: {
    fontSize: isCompactDevice ? 13.5 : 14,
    color: colors.text,
    fontWeight: '600',
  },
  actionSection: {
    gap: 16,
    marginTop: 15,
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  reportText: {
    color: colors.textSecondary || '#94A3B8',
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


