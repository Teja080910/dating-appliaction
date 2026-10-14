import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageSourcePropType,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { getAbsoluteUrl, isApiHostedUrl } from "../../api/apiClient";
import { useConnection } from "../../api/useConnection";
import { useUserImages } from "../../api/useImages";
import { useMyProfile } from "../../api/useProfile";
import UserDetails from "../../components/ProfileTabComponents/ViewMyProfile/UserDetails";
import NotificationBanner from "../../components/NotificationBanner";
import AppContext from "../../context/CreateGlobalStateContext";
import { Colors, useTheme } from "../../theme";
import { useAlert } from "../../components/AlertModal";
import { isResolvedApiUserId, repairStoredSessionIdentity } from "../../utils/session";

import { getAuthToken, getUserId } from "../../utils/sessionHelper";
import { getUserFriendlyMessage, isSubscriptionGateError } from "../../utils/userFriendlyMessages";
import { RootParamList } from "../../utils/types/navigation.types";
import { t, useTranslation } from '../../i18n';

const normalizeTextValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized || null;
};

const flattenProfileSource = (value: any) => {
  if (!value || typeof value !== "object") {
    return {};
  }

  const nestedProfile =
    value?.profile && typeof value.profile === "object" ? value.profile : {};

  return {
    ...nestedProfile,
    ...value,
  };
};

const collectImageUris = (value: unknown): string[] => {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized ? [normalized] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectImageUris(item));
  }

  if (value && typeof value === "object") {
    const imageObject = value as Record<string, unknown>;
    return [
      ...collectImageUris(imageObject.imageUrl),
      ...collectImageUris(imageObject.profileImageUrl),
      ...collectImageUris(imageObject.url),
      ...collectImageUris(imageObject.uri),
      ...collectImageUris(imageObject.path),
      ...collectImageUris(imageObject.image),
      ...collectImageUris(imageObject.photos),
      ...collectImageUris(imageObject.photo),
    ];
  }

  return [];
};

const dedupeImageUris = (items: unknown[]) => {
  const seen = new Set<string>();
  const resolved: string[] = [];

  items
    .flatMap((item) => collectImageUris(item))
    .forEach((item) => {
      const normalized = item.trim();
      if (!normalized || seen.has(normalized)) {
        return;
      }

      seen.add(normalized);
      resolved.push(normalized);
    });

  return resolved;
};

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

const ViewMyProfileScreen = () => {
  useTranslation();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const heroHeight = Math.min(Math.max(screenWidth * 1.15, 320), Math.min(screenHeight * 0.58, 540));
  const navigation = useNavigation<NativeStackNavigationProp<RootParamList>>();
  const route = useRoute<any>();
  const { alert, AlertComponent } = useAlert();
  const {
    name,
    displayName,
    date,
    height,
    profileText,
    profileImage,
    profileImageUrl,
    images: contextImages,
    selectedAppearance,
    selectedBodyType,
    selectedLanguages,
    englishSkillLevel,
    selectedEthinicity,
    selectedSmoking,
    selectedDrinking,
    selectedLookingFor,
    selectedNetWorth,
    setSelectedNetWorth,
    selectedKids,
    setSelectedKids,
    verifiedSelfie,
    location,
    setPaywallVisible,
    isSubscribed,
  } = useContext(AppContext);

  // userId from params if we are viewing someone else
  const {
    userId: paramId,
    targetUserId: paramTargetId,
    profileData: routeProfileData,
    image: routeImage,
    fallbackImage,
    requestId,
    requestRole,
    requestStatus,
  } = (route.params as any) || {};

  const { themeColors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(themeColors, isDark), [themeColors, isDark]);
  const [myId, setMyId] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [authToken, setAuthToken] = useState<string | null>(null);



  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const [directId, token] = await Promise.all([getUserId(), getAuthToken()]);
      if (!isMounted) return;

      if (directId) {
        setMyId(String(directId));
      } else {
        const repairedId = await repairStoredSessionIdentity();
        if (repairedId && isResolvedApiUserId(repairedId) && isMounted) {
          setMyId(String(repairedId));
        }
      }

      setAuthToken(token);
    };

    void init();

    return () => {
      isMounted = false;
    };
  }, []);

  const { getAllImages } = useUserImages();
  const getAllImagesRef = useRef(getAllImages.mutate);
  getAllImagesRef.current = getAllImages.mutate;
  const connection = useConnection(myId || undefined);
  const { send: likeMutation } = connection;

  // Fetch based on whether it's "Me" or "Other"
  const routeTargetId = resolveNumericIdentifier(
    paramTargetId,
    paramId,
    routeProfileData?.id,
    routeProfileData?.targetUserId,
    routeProfileData?.userId,
    routeProfileData?.uid,
    routeProfileData?.profile?.id,
    routeProfileData?.profile?.targetUserId,
    routeProfileData?.profile?.userId,
    routeProfileData?.profile?.uid,
    routeProfileData?.user?.id,
    routeProfileData?.user?.userId,
    routeProfileData?.user?.uid,
  );
  const hasRouteTarget = Boolean(paramTargetId || paramId || routeProfileData);
  const isTargetSameAsMe = Boolean(
    myId &&
    routeTargetId &&
    String(myId).trim().toLowerCase() === String(routeTargetId).trim().toLowerCase()
  );
  // Route params are authoritative. `viewMyProfile` is a UI flag and can stay
  // true after opening this screen, which otherwise makes another user's
  // profile render as the signed-in user's profile.
  const isViewingSelf = Boolean(!hasRouteTarget || isTargetSameAsMe);
  const targetId = isViewingSelf ? myId : routeTargetId;
  const hasValidTargetId =
    typeof targetId === 'number' ||
    (typeof targetId === 'string' &&
      (/^\d+$/.test(targetId) ||
        (/^[A-Za-z0-9_-]+$/.test(targetId) && /[A-Za-z]/.test(targetId))));
  const { data: fetchedProfile, isLoading: loading, refetch: refetchProfile } = useMyProfile(
    hasValidTargetId ? targetId : (isViewingSelf ? undefined : null)
  );
  const numericTargetId = hasValidTargetId ? String(targetId) : null;

  useFocusEffect(
    React.useCallback(() => {
      if (isViewingSelf) {
        void refetchProfile();
        AsyncStorage.getItem('@amara_net_worth').then((val) => {
          if (val && setSelectedNetWorth) setSelectedNetWorth(val);
        });
        AsyncStorage.getItem('@amara_kid_count').then((val) => {
          if (val && setSelectedKids) setSelectedKids(val);
        });
        const activeTarget = myId || numericTargetId;
        if (activeTarget) {
          getAllImagesRef.current(String(activeTarget), {
            onSuccess: (data: any) => {
              setGalleryImages(dedupeImageUris([data]));
            },
          });
        }
      }
    }, [isViewingSelf, refetchProfile, myId, numericTargetId, setSelectedNetWorth, setSelectedKids]),
  );

  useEffect(() => {
    let isMounted = true;

    if (!numericTargetId) {
      setGalleryImages([]);
      return () => {
        isMounted = false;
      };
    }

    getAllImages.mutate(String(numericTargetId), {
      onSuccess: (data: any) => {
        if (!isMounted) {
          return;
        }

        setGalleryImages(dedupeImageUris([data]));
      },
      onError: () => {
        if (isMounted) {
          setGalleryImages([]);
        }
      },
    });

    return () => {
      isMounted = false;
    };
  }, [numericTargetId]);

  const flatlistRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (event: any) => {
    const index = Math.round(
      event.nativeEvent.contentOffset.x / screenWidth
    );
    setActiveIndex(index);
  };

  const sentConnections = Array.isArray(connection.sentList.data) ? connection.sentList.data : [];
  const isAlreadyInvited = useMemo(() => {
    if (!numericTargetId) return false;
    const target = String(numericTargetId).trim().toLowerCase();
    return sentConnections.some((inv: any) => {
      const receiver = inv?.receiver;
      const rId = String(receiver?.id ?? '').trim().toLowerCase();
      const rUserId = String(receiver?.userId ?? '').trim().toLowerCase();
      const invReceiverId = String(inv?.receiverId ?? '').trim().toLowerCase();
      return (rId && rId === target) || (rUserId && rUserId === target) || (invReceiverId && invReceiverId === target);
    });
  }, [sentConnections, numericTargetId]);

  const handleLike = async () => {
    if (!isSubscribed) {
      setPaywallVisible(true);
      return;
    }

    if (!numericTargetId || !myId) return;

    if (isAlreadyInvited) {
      alert(t('profile.viewmyprofilescreen.already_invited'), t('profile.viewmyprofilescreen.you_have_already_sent_an_invitation_to_this_user'));
      return;
    }

    const normalizeId = (id: string) => id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    if (normalizeId(String(numericTargetId)) === normalizeId(String(myId))) {
      alert(t('profile.additionaluploadsection.error'), t('profile.viewmyprofilescreen.you_cannot_send_an_invite_to_yourself'));
      return;
    }

    let senderId = myId;
    if (!isResolvedApiUserId(senderId)) {
      const repairedId = await repairStoredSessionIdentity();
      if (repairedId && isResolvedApiUserId(repairedId)) {
        senderId = String(repairedId);
      } else {
        alert(t('profile.viewmyprofilescreen.account_issue'), t('profile.viewmyprofilescreen.could_not_verify_your_account_please_log_in_agai'));
        return;
      }
    }

    console.log('[handleLike] Sending invite:', { senderId, receiverId: numericTargetId });

    // Pass the verified sender ID explicitly. `myId` can be stale when the
    // session identity was repaired above, which made the API reject the like.
    likeMutation.mutate({ senderId, receiverId: numericTargetId }, {
      onSuccess: () => {
        connection.sentList.refetch();
        const matchedImage =
          mergedProfile?.profileImageUrl ||
          (Array.isArray(mergedProfile?.images) ? mergedProfile.images[0] : null) ||
          mergedProfile?.imageUrl ||
          null;
        navigation.navigate('MatchScreen', {
          matchedUser: {
            id: numericTargetId,
            name: mergedProfile?.displayName || mergedProfile?.name || t('home.usercard.user'),
            image: matchedImage,
            age: mergedProfile?.age || null,
            city: mergedProfile?.currentCity || null,
          },
        });
      },
    onError: (error: any) => {
        console.log('[handleLike] Send failed:', {
          receiverId: numericTargetId,
          status: error?.response?.status,
          details: error?.response?.data,
        });
        const errorDetails = String(
          error?.response?.data?.details ||
          error?.response?.data?.message ||
          (typeof error?.response?.data === 'string' ? error.response.data : '') ||
          error?.message ||
          ''
        ).toLowerCase();

        if (
          error?.response?.status === 400 &&
          (errorDetails.includes('duplicate') || errorDetails.includes('already') || errorDetails.includes('invalid data') || errorDetails.includes('cannot send request to yourself'))
        ) {
          connection.sentList.refetch();
          alert(t('profile.viewmyprofilescreen.already_invited'), t('profile.viewmyprofilescreen.you_have_already_sent_an_invitation_to_this_user'));
          return;
        }
        if (isSubscriptionGateError(error)) {
          // FR-34: quota/subscription errors reopen the paywall automatically.
          setPaywallVisible(true);
          return;
        }
        alert(t('profile.viewmyprofilescreen.couldnt_send_invitation'), getUserFriendlyMessage(error, t('profile.viewmyprofilescreen.we_could_not_send_your_invitation_right_now')));
      },
    });
  };
  const handleDislike = () => {
    navigation.goBack();
  };

  const renderItem = ({ item }: any) => {
    const cleanUrl = typeof item === 'string' ? getAbsoluteUrl(item) : null;
    const imageSource: ImageSourcePropType =
      cleanUrl
        ? isApiHostedUrl(cleanUrl)
          ? {
              uri: cleanUrl,
              headers: {
                'ngrok-skip-browser-warning': '69420',
                'User-Agent': 'AMARA-App',
                ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
              },
            }
          : { uri: cleanUrl }
        : item;

    return (
      <View style={{ width: screenWidth, height: heroHeight }}>
        <Image
          source={imageSource}
          style={[styles.image, { height: heroHeight }]}
        />
      </View>
    );
  };

  const ownAge = useMemo(() => {
    const safeDate = date ? new Date(date) : null;
    if (!safeDate || Number.isNaN(safeDate.getTime())) {
      return null;
    }

    const today = new Date();
    let calculatedAge = today.getFullYear() - safeDate.getFullYear();
    const monthGap = today.getMonth() - safeDate.getMonth();

    if (monthGap < 0 || (monthGap === 0 && today.getDate() < safeDate.getDate())) {
      calculatedAge -= 1;
    }

    return calculatedAge > 0 ? calculatedAge : null;
  }, [date]);

  const mergedProfile = useMemo(() => {
    const fetched = flattenProfileSource(fetchedProfile);
    const routed = flattenProfileSource(routeProfileData);
    const contextLanguage = Array.isArray(selectedLanguages)
      ? selectedLanguages.filter(Boolean).join(", ")
      : null;
    const contextLookingFor = Array.isArray(selectedLookingFor)
      ? selectedLookingFor.filter(Boolean).join(", ")
      : normalizeTextValue(selectedLookingFor);
    const contextEnglishLevel =
      [t('profile.viewmyprofilescreen.beginner'), t('profile.userdetails.intermediate'), "Advanced", "Native"][englishSkillLevel] ||
      t('profile.viewmyprofilescreen.beginner');
    const contextPrimaryImage =
      dedupeImageUris([profileImageUrl, profileImage, contextImages])[0] || null;

    const targetImages = dedupeImageUris([
      fetched?.photos,
      fetched?.images,
      fetched?.allImages,
      routed?.photos,
      routed?.images,
      routed?.allImages,
      galleryImages,
      fetched?.profileImageUrl,
      routed?.profileImageUrl,
      routeImage,
    ]);

    const activeContextPhotos = (contextImages || []).filter(Boolean) as string[];
    const fetchedPhotos = Array.isArray(fetched?.photos) && fetched.photos.length > 0
      ? dedupeImageUris([fetched.photos])
      : [];
    const ownImages = activeContextPhotos.length > 0
      ? activeContextPhotos
      : fetchedPhotos.length > 0
        ? fetchedPhotos
        : galleryImages.length > 0
          ? galleryImages
          : dedupeImageUris([profileImageUrl, profileImage]);

    const mergedImages = isViewingSelf ? ownImages : targetImages;

    return {
      ...routed,
      ...fetched,
      id: (isViewingSelf ? (fetched?.id || myId) : (fetched?.id || routed?.id || numericTargetId)) || null,
      targetUserId: isViewingSelf ? null : (numericTargetId || routed?.targetUserId || routed?.userId || null),
      name: isViewingSelf
        ? (normalizeTextValue(fetched?.name) || normalizeTextValue(name) || normalizeTextValue(displayName) || t('home.usercard.user'))
        : (normalizeTextValue(routed?.name) || normalizeTextValue(fetched?.name) || normalizeTextValue(routed?.displayName) || normalizeTextValue(fetched?.displayName) || t('home.usercard.user')),
      displayName: isViewingSelf
        ? (normalizeTextValue(fetched?.displayName) || normalizeTextValue(displayName) || normalizeTextValue(name) || t('home.usercard.user'))
        : (normalizeTextValue(routed?.displayName) || normalizeTextValue(fetched?.displayName) || normalizeTextValue(routed?.name) || normalizeTextValue(fetched?.name) || t('home.usercard.user')),
      age: isViewingSelf
        ? (fetched?.age || ownAge || null)
        : (routed?.age || fetched?.age || null),
      bio: isViewingSelf
        ? (normalizeTextValue(fetched?.bio) || normalizeTextValue(profileText) || '')
        : (normalizeTextValue(routed?.bio) || normalizeTextValue(fetched?.bio) || ''),
      height: isViewingSelf
        ? (fetched?.height || height || null)
        : (routed?.height || fetched?.height || null),
      appearance: isViewingSelf
        ? (normalizeTextValue(fetched?.appearance) || normalizeTextValue(selectedAppearance) || '')
        : (normalizeTextValue(routed?.appearance) || normalizeTextValue(fetched?.appearance) || ''),
      bodyType: isViewingSelf
        ? (normalizeTextValue(fetched?.bodyType) || normalizeTextValue(selectedBodyType) || '')
        : (normalizeTextValue(routed?.bodyType) || normalizeTextValue(fetched?.bodyType) || ''),
      language: isViewingSelf
        ? (normalizeTextValue(fetched?.language) || contextLanguage || '')
        : (normalizeTextValue(routed?.language) || normalizeTextValue(fetched?.language) || t('profile.userdetails.english')),
      englishLevel: isViewingSelf
        ? (normalizeTextValue(fetched?.englishLevel) || contextEnglishLevel || '')
        : (normalizeTextValue(routed?.englishLevel) || normalizeTextValue(fetched?.englishLevel) || t('profile.viewmyprofilescreen.conversational')),
      ethnicity: isViewingSelf
        ? (normalizeTextValue(fetched?.ethnicity) || normalizeTextValue(selectedEthinicity) || '')
        : (normalizeTextValue(routed?.ethnicity) || normalizeTextValue(fetched?.ethnicity) || t('profile.viewmyprofilescreen.asian')),
      smoke: isViewingSelf
        ? (normalizeTextValue(fetched?.smoke) || normalizeTextValue(selectedSmoking) || '')
        : (normalizeTextValue(routed?.smoke) || normalizeTextValue(fetched?.smoke) || t('profile.viewmyprofilescreen.never')),
      drink: isViewingSelf
        ? (normalizeTextValue(fetched?.drink) || normalizeTextValue(selectedDrinking) || '')
        : (normalizeTextValue(routed?.drink) || normalizeTextValue(fetched?.drink) || t('profile.viewmyprofilescreen.socially')),
      lookingFor: isViewingSelf
        ? (normalizeTextValue(fetched?.lookingFor) || contextLookingFor || '')
        : (normalizeTextValue(routed?.lookingFor) || normalizeTextValue(fetched?.lookingFor) || t('profile.viewmyprofilescreen.long_term')),
      kidCount: isViewingSelf
        ? (normalizeTextValue(fetched?.kidCount) || normalizeTextValue(fetched?.kids) || normalizeTextValue(selectedKids) || '')
        : (normalizeTextValue(routed?.kidCount) || normalizeTextValue(routed?.kids) || normalizeTextValue(fetched?.kidCount) || normalizeTextValue(fetched?.kids) || ''),
      kids: isViewingSelf
        ? (normalizeTextValue(fetched?.kids) || normalizeTextValue(fetched?.kidCount) || normalizeTextValue(selectedKids) || '')
        : (normalizeTextValue(routed?.kids) || normalizeTextValue(routed?.kidCount) || normalizeTextValue(fetched?.kids) || normalizeTextValue(fetched?.kidCount) || ''),
      netWorth: isViewingSelf
        ? (normalizeTextValue(fetched?.netWorth) || normalizeTextValue(selectedNetWorth) || '')
        : (normalizeTextValue(routed?.netWorth) || normalizeTextValue(fetched?.netWorth) || ''),
      currentCity: isViewingSelf
        ? (normalizeTextValue(fetched?.currentCity) || normalizeTextValue(location) || '')
        : (normalizeTextValue(routed?.currentCity) || normalizeTextValue(fetched?.currentCity) || t('home.usercard.nearby')),
      verifiedSelfie: isViewingSelf
        ? Boolean(fetched?.verifiedSelfie ?? fetched?.selfieVerified ?? verifiedSelfie)
        : Boolean(fetched?.verifiedSelfie ?? fetched?.selfieVerified ?? routed?.verifiedSelfie ?? routed?.selfieVerified),
      profileImageUrl: isViewingSelf
        ? (contextPrimaryImage || (ownImages[0] || null) || normalizeTextValue(fetched?.profileImageUrl))
        : (normalizeTextValue(routed?.profileImageUrl) || normalizeTextValue(fetched?.profileImageUrl) || routeImage || (targetImages[0] || null)),
      images: mergedImages.length > 0 ? mergedImages : (routeImage ? [routeImage] : []),
    };
  }, [
    date,
    displayName,
    englishSkillLevel,
    fetchedProfile,
    galleryImages,
    height,
    location,
    myId,
    name,
    numericTargetId,
    ownAge,
    profileImage,
    profileImageUrl,
    profileText,
    routeImage,
    routeProfileData,
    selectedAppearance,
    selectedBodyType,
    selectedDrinking,
    selectedEthinicity,
    selectedKids,
    selectedLanguages,
    selectedLookingFor,
    selectedNetWorth,
    selectedSmoking,
    verifiedSelfie,
    contextImages,
  ]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const profileImages = (
    isViewingSelf
      ? (mergedProfile?.images && mergedProfile.images.length > 0
          ? mergedProfile.images
          : dedupeImageUris([mergedProfile?.profileImageUrl]))
      : dedupeImageUris([
          mergedProfile?.images,
          mergedProfile?.profileImageUrl,
          routeImage,
        ])
  ).map((image: string | null | undefined) => getAbsoluteUrl(image));
  const sliderImages =
    profileImages.length > 0
      ? profileImages
      : fallbackImage
        ? [fallbackImage]
        : [];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={themeColors.background}
      />
      {/* Top Notification Banner */}
      <NotificationBanner />

      {/* Top Header Bar */}
      <View style={styles.topNavBar}>
        <TouchableOpacity
          style={styles.navLeftRow}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Icon name="chevron-left" size={28} color={themeColors.text} style={styles.navBackIcon} />
          <Text style={styles.brandLogoText}>{t('home.homeheader.amara')}</Text>
        </TouchableOpacity>

        {isViewingSelf ? (
          <TouchableOpacity
            style={styles.pillEditBtn}
            onPress={() => navigation.navigate('ProfileSettingsScreen')}
            activeOpacity={0.8}
          >
            <Text style={styles.pillEditBtnText}>{t('profile.userdetails.edit')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.navRightPlaceholder} />
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, !isViewingSelf && requestRole !== 'received' ? styles.scrollContentWithFooter : null]}
      >
        {/* Hero Photo Carousel */}
        <View style={styles.sliderWrapper}>
          {sliderImages.length > 0 ? (
            <View style={styles.imageCard}>
              <Image
                source={
                  typeof sliderImages[activeIndex] === 'string'
                    ? isApiHostedUrl(getAbsoluteUrl(sliderImages[activeIndex])!)
                      ? {
                          uri: getAbsoluteUrl(sliderImages[activeIndex])!,
                          headers: {
                            'ngrok-skip-browser-warning': '69420',
                            'User-Agent': 'AMARA-App',
                            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                          },
                        }
                      : { uri: getAbsoluteUrl(sliderImages[activeIndex])! }
                    : sliderImages[activeIndex]
                }
                style={styles.image}
                resizeMode="cover"
                blurRadius={!isViewingSelf && !isSubscribed ? (Platform.OS === 'android' ? 22 : 16) : 0}
              />

              {/* Upgrade to premium blur overlay card when viewing another user and not subscribed */}
              {!isViewingSelf && !isSubscribed && (
                <View style={styles.blurCardOverlayWrapper} pointerEvents="box-none">
                  <View style={styles.blurCardOverlay}>
                    <TouchableOpacity
                      style={styles.upgradePillBtn}
                      activeOpacity={0.85}
                      onPress={() => setPaywallVisible(true)}
                    >
                      <MaterialCommunityIcons name="crown" size={20} color="#FF4D6D" style={styles.crownIcon} />
                      <Text style={styles.upgradePillText}>{t('profile.viewmyprofilescreen.upgrade_to_premium')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {sliderImages.length > 1 && (
                <>
                  <TouchableOpacity
                    style={styles.heroTapLeft}
                    activeOpacity={1}
                    onPress={() =>
                      setActiveIndex((prev) =>
                        prev > 0 ? prev - 1 : sliderImages.length - 1
                      )
                    }
                  />
                  <TouchableOpacity
                    style={styles.heroTapRight}
                    activeOpacity={1}
                    onPress={() =>
                      setActiveIndex((prev) =>
                        prev + 1 < sliderImages.length ? prev + 1 : 0
                      )
                    }
                  />
                </>
              )}

              {/* Dots Indicator */}
              {sliderImages.length > 1 && (
                <View style={styles.dotsContainer} pointerEvents="none">
                  {sliderImages.map((_: any, index: number) => (
                    <View
                      key={index}
                      style={[
                        styles.dot,
                        {
                          backgroundColor:
                            index === activeIndex
                              ? '#FFFFFF'
                              : 'rgba(255, 255, 255, 0.45)',
                          width: index === activeIndex ? 22 : 6,
                        },
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.emptyHero}>
              <Icon name="image" size={42} color={Colors.textMuted} />
            </View>
          )}
        </View>

        <UserDetails
          profile={mergedProfile}
          currentUserId={myId}
          targetUserId={isViewingSelf ? undefined : numericTargetId}
          requestId={requestId}
          requestRole={requestRole}
          requestStatus={requestStatus}
        />
      </ScrollView>

      {/* Sticky Bottom Full-Width Send Invite Pill */}
      {!isViewingSelf && requestRole !== 'received' && (
        <View style={styles.stickyBottomBar}>
          <TouchableOpacity
            style={[
              styles.sendInvitePill,
              (isAlreadyInvited || likeMutation.isPending) && styles.sendInvitePillDisabled,
            ]}
            activeOpacity={0.85}
            onPress={handleLike}
            disabled={isAlreadyInvited || likeMutation.isPending}
          >
            {likeMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <View style={styles.sendInviteContent}>
                <MaterialCommunityIcons
                  name={isAlreadyInvited ? "check-circle-outline" : "send"}
                  size={19}
                  color="#FFFFFF"
                  style={styles.sendInviteIcon}
                />
                <Text style={styles.sendInviteText}>
                  {isAlreadyInvited ? t('profile.viewmyprofilescreen.invitation_sent') : t('profile.viewmyprofilescreen.send_invite')}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}
      {AlertComponent}
    </SafeAreaView>
  );
};

export default ViewMyProfileScreen;

const createStyles = (colors: any, isDark: boolean = true) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    topNavBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: colors.background,
    },
    navLeftRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    navBackIcon: {
      marginRight: 2,
    },
    brandLogoText: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: -0.5,
    },
    navRightPlaceholder: {
      width: 32,
    },
    pillEditBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 6,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    pillEditBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    loader: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    sliderWrapper: {
      width: '100%',
      paddingHorizontal: 16,
    },
    imageCard: {
      width: '100%',
      height: 440,
      borderRadius: 14,
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 30,
    },
    scrollContentWithFooter: {
      paddingBottom: 110,
    },
    image: {
      width: "100%",
      height: "100%",
      resizeMode: "cover",
    },
    heroTapLeft: {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      width: '45%',
      zIndex: 5,
    },
    heroTapRight: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      width: '55%',
      zIndex: 5,
    },
    emptyHero: {
      width: "100%",
      height: 380,
      borderRadius: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      justifyContent: "center",
      alignItems: "center",
    },
    dotsContainer: {
      flexDirection: "row",
      position: "absolute",
      bottom: 14,
      alignSelf: "center",
      gap: 6,
      zIndex: 6,
    },
    dot: {
      height: 6,
      borderRadius: 3,
    },
    blurCardOverlayWrapper: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    blurCardOverlay: {
      width: 230,
      height: 230,
      borderRadius: 24,
      backgroundColor: isDark ? 'rgba(30, 24, 38, 0.52)' : 'rgba(255, 255, 255, 0.38)',
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.65)',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 6,
    },
    upgradePillBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#1E1924',
      paddingVertical: 12,
      paddingHorizontal: 22,
      borderRadius: 25,
      elevation: 6,
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowRadius: 6,
    },
    crownIcon: {
      marginRight: 8,
    },
    upgradePillText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
    },
    stickyBottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.background,
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: Platform.OS === 'ios' ? 24 : 16,
      borderTopWidth: 1,
      borderColor: colors.glassBorder,
      zIndex: 20,
    },
    sendInvitePill: {
      backgroundColor: colors.primary || '#7C3AED',
      height: 52,
      borderRadius: 26,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
      shadowColor: colors.primary || '#7C3AED',
      shadowOpacity: 0.35,
      shadowRadius: 6,
    },
    sendInvitePillDisabled: {
      opacity: 0.7,
      backgroundColor: colors.disabled || '#554270',
    },
    sendInviteContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendInviteIcon: {
      marginRight: 8,
    },
    sendInviteText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },
  });


