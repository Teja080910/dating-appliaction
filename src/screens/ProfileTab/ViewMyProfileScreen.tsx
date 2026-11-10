import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  FlatList,
  Image,
  ImageSourcePropType,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import apiClient, { getAbsoluteUrl, isApiHostedUrl } from "../../api/apiClient";
import { useConnection } from "../../api/useConnection";
import { useSubscription } from "../../api/useSubscription";
import { useUserImages } from "../../api/useImages";
import { useMyProfile } from "../../api/useProfile";
import { useMyTelegramStatus } from "../../api/useTelegram";
import UserDetails from "../../components/ProfileTabComponents/ViewMyProfile/UserDetails";
import NotificationBanner from "../../components/NotificationBanner";
import SubscriptionModal from "../../components/SubscriptionModal";
import AppContext from "../../context/CreateGlobalStateContext";
import { Colors, useTheme } from "../../theme";
import { useAlert } from "../../components/AlertModal";
import { isResolvedApiUserId, repairStoredSessionIdentity } from "../../utils/session";
import { mockStore } from "../../mock/mockStore";
import { openWhatsAppChat, extractPhone, extractTelegram } from "../../utils/whatsappHelper";

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
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  // 1 : 1.28-1.34 aspect ratio matches the Discover grid framing so portrait photos and heads are fully visible without being cropped
  const heroCardHeight = Math.min(Math.max(Math.round(screenWidth * 1.28), 380), 500);
  const navigation = useNavigation<NativeStackNavigationProp<RootParamList>>();
  const route = useRoute<any>();
  const { alert, AlertComponent } = useAlert();
  const {
    name,
    displayName,
    gender,
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
    paywallVisible,
    setPaywallVisible,
    isSubscribed,
    setIsSubscribed,
    phoneNumber: contextPhone,
  } = useContext(AppContext);

  const [localPaywallVisible, setLocalPaywallVisible] = useState(false);
  const [storedPhone, setStoredPhone] = useState<string>('');
  const [storedTelegram, setStoredTelegram] = useState<string>('');
  const { data: myTgStatus } = useMyTelegramStatus();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [p1, p2, tg] = await Promise.all([
          AsyncStorage.getItem('phoneNumber'),
          AsyncStorage.getItem('userMobile'),
          AsyncStorage.getItem('telegramUsername'),
        ]);
        if (isMounted) {
          if (p1 || p2) setStoredPhone(p1 || p2 || '');
          if (tg) setStoredTelegram(tg.replace(/^@+/, ''));
        }
      } catch {}
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const openSubscriptionPlans = () => {
    console.log('[ViewMyProfileScreen] openSubscriptionPlans: Opening plans modal');
    setLocalPaywallVisible(true);
    setPaywallVisible?.(true);
  };

  const [viewerGender, setViewerGender] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchViewerGender = async () => {
      try {
        const [g1, g2] = await Promise.all([
          AsyncStorage.getItem('selectedGender'),
          AsyncStorage.getItem('userGender'),
        ]);
        const found = g1 || g2 || '';
        if (isMounted && found) {
          setViewerGender(found);
        }
      } catch {}
    };
    void fetchViewerGender();
    return () => {
      isMounted = false;
    };
  }, []);

  const rawViewerGender = String(gender || viewerGender || '').toLowerCase();
  const isViewerWoman = rawViewerGender.includes('woman') || rawViewerGender.includes('female');

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
  const [ownGalleryImages, setOwnGalleryImages] = useState<string[]>([]);
  const [targetGalleryImages, setTargetGalleryImages] = useState<string[]>([]);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const { subscriptionStatus } = useSubscription(myId);
  const [localSubActive, setLocalSubActive] = useState<boolean | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      const checkLocalSub = async () => {
        try {
          const [storedSub, storedEnd] = await Promise.all([
            AsyncStorage.getItem('isSubscribed'),
            AsyncStorage.getItem('@subscription_endDate'),
          ]);
          const isNotExpired = !storedEnd || new Date(storedEnd).getTime() > Date.now();
          if (isMounted) {
            setLocalSubActive(storedSub === 'true' && isNotExpired);
          }
        } catch {}
      };
      void checkLocalSub();
      return () => {
        isMounted = false;
      };
    }, [])
  );

  const effectiveIsSubscribed = Boolean(
    isSubscribed ||
    subscriptionStatus?.active ||
    localSubActive
  );

  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      const syncSubscription = async () => {
        if (isViewerWoman) return;
        const currentUserId = myId || (await getUserId());

        // 1. Immediately honor valid local storage so UI doesn't flash unsubscribed
        try {
          const [storedSub, storedEnd, storedPlan] = await Promise.all([
            AsyncStorage.getItem('isSubscribed'),
            AsyncStorage.getItem('@subscription_endDate'),
            AsyncStorage.getItem('@subscription_plan'),
          ]);
          const isNotExpired = !storedEnd || new Date(storedEnd).getTime() > Date.now();
          if (storedSub === 'true' && isNotExpired) {
            if (isMounted) setIsSubscribed?.(true);
          }
        } catch {}

        if (!currentUserId) return;

        try {
          // 2. Query live backend subscription status
          let apiActive = false;
          let planName = 'STANDARD';
          let endDate: string | null = null;
          let remainingDays: number | null = null;

          try {
            const res = await apiClient.get('/subscriber/status', {
              params: { userId: String(currentUserId) },
            });
            const d = res?.data?.data || res?.data;
            if (d && (d.active || d.isActive || d.status === 'ACTIVE' || d.isSubscriber)) {
              apiActive = true;
              planName = d.plan || d.planType || 'STANDARD';
              endDate = d.endDate || null;
              remainingDays = d.remainingDays ?? d.daysRemaining ?? null;
            }
          } catch {}

          // 3. Fallback to mock store
          if (!apiActive) {
            const sub = await mockStore.getSubscriptionStatus(String(currentUserId));
            if (sub && sub.status === 'ACTIVE') {
              apiActive = true;
              planName = sub.plan || 'STANDARD';
              endDate = sub.endDate || null;
            }
          }

          if (apiActive) {
            if (isMounted) setIsSubscribed?.(true);
            await AsyncStorage.setItem('isSubscribed', 'true');
            await AsyncStorage.setItem('@subscription_plan', planName.toUpperCase());
            if (endDate) await AsyncStorage.setItem('@subscription_endDate', endDate);
            if (remainingDays !== null) await AsyncStorage.setItem('@subscription_remainingDays', String(remainingDays));
            await mockStore.activateSubscription(String(currentUserId), planName);
          } else {
            // Check if local storage is valid and not expired before clearing
            const [storedSub, storedEnd] = await Promise.all([
              AsyncStorage.getItem('isSubscribed'),
              AsyncStorage.getItem('@subscription_endDate'),
            ]);
            const isNotExpired = !storedEnd || new Date(storedEnd).getTime() > Date.now();
            if (storedSub === 'true' && isNotExpired) {
              if (isMounted) setIsSubscribed?.(true);
            } else {
              if (isMounted) setIsSubscribed?.(false);
              await AsyncStorage.multiRemove(['isSubscribed', '@subscription_plan', '@subscription_endDate', '@subscription_remainingDays']);
            }
          }
        } catch {
          // Preserve current state on network error
        }
      };
      void syncSubscription();
      return () => {
        isMounted = false;
      };
    }, [myId, isViewerWoman, setIsSubscribed])
  );



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

  const connectionRef = useRef(connection);
  connectionRef.current = connection;
  const refetchProfileRef = useRef(refetchProfile);
  refetchProfileRef.current = refetchProfile;
  const selectedNetWorthRef = useRef(selectedNetWorth);
  selectedNetWorthRef.current = selectedNetWorth;
  const selectedKidsRef = useRef(selectedKids);
  selectedKidsRef.current = selectedKids;

  useFocusEffect(
    React.useCallback(() => {
      void refetchProfileRef.current?.();
      void connectionRef.current?.sentList?.refetch?.();
      void connectionRef.current?.receivedList?.refetch?.();

      if (isViewingSelf) {
        AsyncStorage.getItem('@amara_net_worth').then((val) => {
          if (val && val !== selectedNetWorthRef.current && setSelectedNetWorth) {
            setSelectedNetWorth(val);
          }
        });
        AsyncStorage.getItem('@amara_kid_count').then((val) => {
          if (val && val !== selectedKidsRef.current && setSelectedKids) {
            setSelectedKids(val);
          }
        });
        if (myId) {
          getAllImagesRef.current(String(myId), {
            onSuccess: (data: any) => {
              setOwnGalleryImages(dedupeImageUris([data]));
            },
          });
        }
      }
    }, [isViewingSelf, myId, setSelectedNetWorth, setSelectedKids]),
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('AMARA_PROFILE_UPDATED', () => {
      void refetchProfileRef.current?.();
      if (isViewingSelf && myId) {
        getAllImagesRef.current(String(myId), {
          onSuccess: (data: any) => {
            setOwnGalleryImages(dedupeImageUris([data]));
          },
        });
      }
    });
    return () => {
      sub.remove();
    };
  }, [isViewingSelf, myId]);

  useEffect(() => {
    let isMounted = true;
    setTargetGalleryImages([]); // Clear immediately when switching target to prevent leaking other profiles

    if (!numericTargetId || isViewingSelf) {
      return () => {
        isMounted = false;
      };
    }

    getAllImages.mutate(String(numericTargetId), {
      onSuccess: (data: any) => {
        if (!isMounted) return;
        setTargetGalleryImages(dedupeImageUris([data]));
      },
      onError: () => {
        if (isMounted) {
          setTargetGalleryImages([]);
        }
      },
    });

    return () => {
      isMounted = false;
    };
  }, [numericTargetId, isViewingSelf]);

  const flatlistRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (event: any) => {
    const index = Math.round(
      event.nativeEvent.contentOffset.x / screenWidth
    );
    setActiveIndex(index);
  };

  const isSameId = (a: any, b: any) => {
    const sa = String(a || '').trim().toLowerCase();
    const sb = String(b || '').trim().toLowerCase();
    if (!sa || !sb || sa === '0' || sb === '0') return false;
    if (sa === sb) return true;
    const da = sa.replace(/[^\d]/g, '');
    const db = sb.replace(/[^\d]/g, '');
    if (da && db && da === db && da !== '0') return true;
    return false;
  };

  const isAcceptedStatus = (st?: string | null) => {
    if (!st) return false;
    const s = String(st).toUpperCase();
    return s === 'APPROVED' || s === 'ACCEPTED' || s === 'SUCCESS';
  };

  const sentConnections = Array.isArray(connection.sentList.data) ? connection.sentList.data : [];
  const matchingInvitation = useMemo(() => {
    if (!numericTargetId) return null;
    return sentConnections.find((inv: any) => {
      if (requestId && String(inv?.id).trim() === String(requestId).trim()) return true;
      const receiver = inv?.receiver;
      const rId = receiver?.id ?? receiver?.userId ?? inv?.receiverId;
      return isSameId(rId, numericTargetId);
    });
  }, [sentConnections, numericTargetId, requestId]);

  const receivedConnections = Array.isArray(connection.receivedList.data) ? connection.receivedList.data : [];
  const matchingReceived = useMemo(() => {
    if (!numericTargetId) return null;
    return receivedConnections.find((inv: any) => {
      if (requestId && String(inv?.id).trim() === String(requestId).trim()) return true;
      const sender = inv?.sender;
      const sId = sender?.id ?? sender?.userId ?? inv?.senderId;
      return isSameId(sId, numericTargetId);
    });
  }, [receivedConnections, numericTargetId, requestId]);

  const mutualConnections = Array.isArray(connection.connectionList?.data) ? connection.connectionList.data : [];
  const matchingMatch = useMemo(() => {
    if (!numericTargetId) return null;
    return mutualConnections.find((conn: any) => {
      const uId = conn?.receiver?.id ?? conn?.receiver?.userId ?? conn?.sender?.id ?? conn?.sender?.userId ?? conn?.id;
      return isSameId(uId, numericTargetId);
    });
  }, [mutualConnections, numericTargetId]);

  const isAcceptedMatch = useMemo(() => {
    return (
      Boolean(matchingMatch) ||
      isAcceptedStatus(matchingInvitation?.status) ||
      isAcceptedStatus(matchingReceived?.status) ||
      isAcceptedStatus(requestStatus)
    );
  }, [matchingMatch, matchingInvitation, matchingReceived, requestStatus]);

  const isAlreadyInvited = Boolean(matchingInvitation);
  const isPendingInvite = isAlreadyInvited && !isAcceptedMatch;

  const openWhatsAppUrl = (phone: string) => {
    void openWhatsAppChat(phone);
  };

  const openTelegramUrl = (username: string) => {
    const cleanUser = username.trim().replace(/^@+/, '');
    const url = `https://t.me/${cleanUser}`;
    Linking.openURL(url).catch(() => {
      Alert.alert(
        t('profile.contactdetails.telegram_not_installed', { defaultValue: 'Telegram Not Installed' }),
        t('profile.contactdetails.telegram_not_installed_desc', { defaultValue: 'Please install Telegram or visit the link in your browser.' })
      );
    });
  };

  const handleLike = async () => {
    let activeSubscribed = effectiveIsSubscribed;
    if (!activeSubscribed) {
      try {
        const storedSub = await AsyncStorage.getItem('isSubscribed');
        const storedEnd = await AsyncStorage.getItem('@subscription_endDate');
        const isNotExpired = !storedEnd || new Date(storedEnd).getTime() > Date.now();
        if (storedSub === 'true' && isNotExpired) {
          activeSubscribed = true;
          setIsSubscribed?.(true);
        } else if (myId) {
          try {
            const res = await apiClient.get('/subscriber/status', { params: { userId: String(myId) } });
            const d = res?.data?.data || res?.data;
            if (d && (d.active || d.isActive || d.status === 'ACTIVE' || d.isSubscriber)) {
              activeSubscribed = true;
              setIsSubscribed?.(true);
              await AsyncStorage.setItem('isSubscribed', 'true');
            }
          } catch {}
          if (!activeSubscribed) {
            const sub = await mockStore.getSubscriptionStatus(String(myId));
            if (sub && sub.status === 'ACTIVE') {
              activeSubscribed = true;
              await AsyncStorage.setItem('isSubscribed', 'true');
              setIsSubscribed?.(true);
            }
          }
        }
      } catch {}
    }

    if (!activeSubscribed && !isViewerWoman) {
      openSubscriptionPlans();
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

    if (!isViewerWoman) {
      // Check daily request quota limit for active plan
      const userPlan = (await AsyncStorage.getItem('@subscription_plan')) || 'STANDARD';
      const planNormalized = userPlan.toUpperCase();
      const dailyLimit =
        planNormalized === 'STANDARD' || planNormalized === 'BASIC'
          ? 10
          : planNormalized === 'PREMIUM' || planNormalized === 'GOLD'
          ? 20
          : null; // null = Unlimited (ELITE)

      if (dailyLimit !== null) {
        const sentConnections = Array.isArray(connection.sentList.data) ? connection.sentList.data : [];
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const sentTodayCount = sentConnections.filter((inv: any) => {
          if (!inv?.createdAt) return false;
          return new Date(inv.createdAt).getTime() >= startOfDay.getTime();
        }).length;

        if (sentTodayCount >= dailyLimit) {
          alert(
            'Daily Request Limit Reached',
            `You have used your ${dailyLimit} daily requests on the ${planNormalized === 'STANDARD' ? 'Standard' : 'Premium'} plan.\n\nUpgrade to ${planNormalized === 'STANDARD' ? 'Premium (20/day) or Elite (Unlimited)' : 'Elite (Unlimited requests)'} to send more requests today!`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Upgrade Plan', onPress: () => openSubscriptionPlans() },
            ]
          );
          return;
        }
      }
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
        const myImage =
          profileImageUrl ||
          profileImage ||
          (Array.isArray(contextImages) ? contextImages.find(Boolean) : null) ||
          null;
        navigation.navigate('MatchScreen', {
          matchedUser: {
            id: numericTargetId,
            name: mergedProfile?.displayName || mergedProfile?.name || t('home.usercard.user'),
            image: matchedImage,
            gender: mergedProfile?.gender || (isViewerWoman ? 'man' : 'woman'),
            age: mergedProfile?.age || null,
            city: mergedProfile?.currentCity || null,
          },
          currentUser: {
            id: senderId,
            name: displayName || name || t('home.usercard.user'),
            image: myImage,
            gender: gender || (isViewerWoman ? 'woman' : 'man'),
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
          (error?.response?.status === 400 || error?.response?.status === 409) &&
          (errorDetails.includes('duplicate') || errorDetails.includes('already') || errorDetails.includes('invalid data') || errorDetails.includes('cannot send request to yourself'))
        ) {
          connection.sentList.refetch();
          alert(t('profile.viewmyprofilescreen.already_invited'), t('profile.viewmyprofilescreen.you_have_already_sent_an_invitation_to_this_user'));
          return;
        }
        if (isSubscriptionGateError(error)) {
          if (errorDetails.includes('limit') || errorDetails.includes('quota') || errorDetails.includes('daily')) {
            alert(
              'Daily Request Limit Reached',
              'You have reached your daily request limit for your subscription plan. Upgrade your plan to send more requests today!',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Upgrade Plan', onPress: () => openSubscriptionPlans() },
              ]
            );
            return;
          }
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
      <View style={{ width: screenWidth, height: heroCardHeight }}>
        <Image
          source={imageSource}
          style={[styles.image, { height: heroCardHeight }]}
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

  const isTargetUserFetched = useMemo(() => {
    if (isViewingSelf || !numericTargetId || !fetchedProfile) return false;
    const flatFetched = flattenProfileSource(fetchedProfile);
    return Boolean(
      (isSameId(flatFetched?.id, numericTargetId) || isSameId(flatFetched?.userId, numericTargetId)) &&
      !isSameId(flatFetched?.id, myId)
    );
  }, [isViewingSelf, numericTargetId, fetchedProfile, myId]);

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
      targetGalleryImages,
      routed?.photos,
      routed?.images,
      routed?.allImages,
      routeImage,
      routed?.profileImageUrl,
      fetched?.photos,
      fetched?.images,
      fetched?.profileImageUrl,
    ]);

    const activeContextPhotos = (contextImages || []).filter(Boolean) as string[];
    const fetchedPhotos = Array.isArray(fetched?.photos) && fetched.photos.length > 0
      ? dedupeImageUris([fetched.photos])
      : [];
    const ownImages = activeContextPhotos.length > 0
      ? activeContextPhotos
      : ownGalleryImages.length > 0
        ? ownGalleryImages
        : fetchedPhotos.length > 0
          ? fetchedPhotos
          : dedupeImageUris([profileImageUrl, profileImage]);

    const mergedImages = isViewingSelf ? ownImages : targetImages;

    const baseData = isViewingSelf
      ? { ...routed, ...fetched }
      : (isTargetUserFetched ? { ...routed, ...fetched } : { ...routed });

    return {
      ...baseData,
      id: (isViewingSelf ? (fetched?.id || myId) : (numericTargetId || (isTargetUserFetched ? fetched?.id : null) || routed?.id)) || null,
      targetUserId: isViewingSelf ? null : (numericTargetId || routed?.targetUserId || routed?.userId || null),
      name: isViewingSelf
        ? (normalizeTextValue(fetched?.name) || normalizeTextValue(name) || normalizeTextValue(displayName) || t('home.usercard.user'))
        : (normalizeTextValue(routed?.name) || (isTargetUserFetched ? normalizeTextValue(fetched?.name) : '') || normalizeTextValue(routed?.displayName) || (isTargetUserFetched ? normalizeTextValue(fetched?.displayName) : '') || t('home.usercard.user')),
      displayName: isViewingSelf
        ? (normalizeTextValue(fetched?.displayName) || normalizeTextValue(displayName) || normalizeTextValue(name) || t('home.usercard.user'))
        : (normalizeTextValue(routed?.displayName) || (isTargetUserFetched ? normalizeTextValue(fetched?.displayName) : '') || normalizeTextValue(routed?.name) || (isTargetUserFetched ? normalizeTextValue(fetched?.name) : '') || t('home.usercard.user')),
      age: isViewingSelf
        ? (fetched?.age || ownAge || null)
        : (routed?.age || (isTargetUserFetched ? fetched?.age : null) || null),
      bio: isViewingSelf
        ? (normalizeTextValue(fetched?.bio) || normalizeTextValue(profileText) || '')
        : (normalizeTextValue(routed?.bio) || (isTargetUserFetched ? normalizeTextValue(fetched?.bio) : '') || ''),
      height: isViewingSelf
        ? (fetched?.height || height || null)
        : (routed?.height || (isTargetUserFetched ? fetched?.height : null) || null),
      appearance: isViewingSelf
        ? (normalizeTextValue(fetched?.appearance) || normalizeTextValue(selectedAppearance) || '')
        : (normalizeTextValue(routed?.appearance) || (isTargetUserFetched ? normalizeTextValue(fetched?.appearance) : '') || ''),
      bodyType: isViewingSelf
        ? (normalizeTextValue(fetched?.bodyType) || normalizeTextValue(selectedBodyType) || '')
        : (normalizeTextValue(routed?.bodyType) || (isTargetUserFetched ? normalizeTextValue(fetched?.bodyType) : '') || ''),
      language: isViewingSelf
        ? (normalizeTextValue(fetched?.language) || contextLanguage || '')
        : (normalizeTextValue(routed?.language) || (isTargetUserFetched ? normalizeTextValue(fetched?.language) : '') || t('profile.userdetails.english')),
      englishLevel: isViewingSelf
        ? (normalizeTextValue(fetched?.englishLevel) || contextEnglishLevel || '')
        : (normalizeTextValue(routed?.englishLevel) || (isTargetUserFetched ? normalizeTextValue(fetched?.englishLevel) : '') || t('profile.viewmyprofilescreen.conversational')),
      ethnicity: isViewingSelf
        ? (normalizeTextValue(fetched?.ethnicity) || normalizeTextValue(selectedEthinicity) || '')
        : (normalizeTextValue(routed?.ethnicity) || (isTargetUserFetched ? normalizeTextValue(fetched?.ethnicity) : '') || t('profile.viewmyprofilescreen.asian')),
      smoke: isViewingSelf
        ? (normalizeTextValue(fetched?.smoke) || normalizeTextValue(selectedSmoking) || '')
        : (normalizeTextValue(routed?.smoke) || (isTargetUserFetched ? normalizeTextValue(fetched?.smoke) : '') || t('profile.viewmyprofilescreen.never')),
      drink: isViewingSelf
        ? (normalizeTextValue(fetched?.drink) || normalizeTextValue(selectedDrinking) || '')
        : (normalizeTextValue(routed?.drink) || (isTargetUserFetched ? normalizeTextValue(fetched?.drink) : '') || t('profile.viewmyprofilescreen.socially')),
      lookingFor: isViewingSelf
        ? (normalizeTextValue(fetched?.lookingFor) || contextLookingFor || '')
        : (normalizeTextValue(routed?.lookingFor) || (isTargetUserFetched ? normalizeTextValue(fetched?.lookingFor) : '') || t('profile.viewmyprofilescreen.long_term')),
      kidCount: isViewingSelf
        ? (normalizeTextValue(fetched?.kidCount) || normalizeTextValue(fetched?.kids) || normalizeTextValue(selectedKids) || '')
        : (normalizeTextValue(routed?.kidCount) || normalizeTextValue(routed?.kids) || (isTargetUserFetched ? (normalizeTextValue(fetched?.kidCount) || normalizeTextValue(fetched?.kids)) : '') || ''),
      kids: isViewingSelf
        ? (normalizeTextValue(fetched?.kids) || normalizeTextValue(fetched?.kidCount) || normalizeTextValue(selectedKids) || '')
        : (normalizeTextValue(routed?.kids) || normalizeTextValue(routed?.kidCount) || (isTargetUserFetched ? (normalizeTextValue(fetched?.kids) || normalizeTextValue(fetched?.kidCount)) : '') || ''),
      netWorth: isViewingSelf
        ? (normalizeTextValue(fetched?.netWorth) || normalizeTextValue(selectedNetWorth) || '')
        : (normalizeTextValue(routed?.netWorth) || (isTargetUserFetched ? normalizeTextValue(fetched?.netWorth) : '') || ''),
      currentCity: isViewingSelf
        ? (normalizeTextValue(fetched?.currentCity) || normalizeTextValue(location) || '')
        : (normalizeTextValue(routed?.currentCity) || (isTargetUserFetched ? normalizeTextValue(fetched?.currentCity) : '') || normalizeTextValue(routed?.city) || t('home.usercard.nearby')),
      location: isViewingSelf
        ? (normalizeTextValue(fetched?.location) || normalizeTextValue(location) || '')
        : (normalizeTextValue(routed?.location) || (isTargetUserFetched ? normalizeTextValue(fetched?.location) : '') || normalizeTextValue(routed?.place) || ''),
      place: routed?.place || fetched?.place || null,
      neighborhood: routed?.neighborhood || fetched?.neighborhood || null,
      area: routed?.area || fetched?.area || null,
      lastActive: routed?.lastActive || fetched?.lastActive || null,
      online: Boolean(routed?.online ?? fetched?.online ?? false),
      distance: isViewingSelf
        ? ''
        : (routed?.distance || (isTargetUserFetched ? fetched?.distance : '') || ''),
      distanceKm: isViewingSelf
        ? null
        : (routed?.distanceKm ?? (isTargetUserFetched ? fetched?.distanceKm : null) ?? null),
      latitude: routed?.latitude ?? fetched?.latitude ?? routed?.lat ?? fetched?.lat ?? null,
      longitude: routed?.longitude ?? fetched?.longitude ?? routed?.lng ?? fetched?.lng ?? null,
      verifiedSelfie: isViewingSelf
        ? Boolean(fetched?.verifiedSelfie ?? fetched?.selfieVerified ?? verifiedSelfie)
        : Boolean((isTargetUserFetched ? (fetched?.verifiedSelfie ?? fetched?.selfieVerified) : null) ?? routed?.verifiedSelfie ?? routed?.selfieVerified),
      telegramUsername: isViewingSelf
        ? (normalizeTextValue(fetched?.telegramUsername) || normalizeTextValue(storedTelegram) || normalizeTextValue(myTgStatus?.telegramUsername) || '')
        : (normalizeTextValue(routed?.telegramUsername) || (isTargetUserFetched ? normalizeTextValue(fetched?.telegramUsername) : '')),
      phoneNumber: isViewingSelf
        ? (normalizeTextValue(fetched?.phoneNumber) || normalizeTextValue(fetched?.mobile) || normalizeTextValue(fetched?.phone) || normalizeTextValue(fetched?.mobileNumber) || normalizeTextValue(contextPhone) || normalizeTextValue(storedPhone) || '')
        : (normalizeTextValue(routed?.phoneNumber) || normalizeTextValue(routed?.mobile) || normalizeTextValue(routed?.phone) || normalizeTextValue(routed?.mobileNumber) || (isTargetUserFetched ? (normalizeTextValue(fetched?.phoneNumber) || normalizeTextValue(fetched?.mobile) || normalizeTextValue(fetched?.phone) || normalizeTextValue(fetched?.mobileNumber)) : '')),
      mobile: isViewingSelf
        ? (normalizeTextValue(fetched?.mobile) || normalizeTextValue(fetched?.phoneNumber) || normalizeTextValue(fetched?.phone) || normalizeTextValue(fetched?.mobileNumber) || normalizeTextValue(contextPhone) || normalizeTextValue(storedPhone) || '')
        : (normalizeTextValue(routed?.mobile) || normalizeTextValue(routed?.phoneNumber) || normalizeTextValue(routed?.phone) || normalizeTextValue(routed?.mobileNumber) || (isTargetUserFetched ? (normalizeTextValue(fetched?.mobile) || normalizeTextValue(fetched?.phoneNumber) || normalizeTextValue(fetched?.phone) || normalizeTextValue(fetched?.mobileNumber)) : '')),
      phone: isViewingSelf
        ? (normalizeTextValue(fetched?.phone) || normalizeTextValue(fetched?.phoneNumber) || normalizeTextValue(fetched?.mobile) || normalizeTextValue(fetched?.mobileNumber) || normalizeTextValue(contextPhone) || normalizeTextValue(storedPhone) || '')
        : (normalizeTextValue(routed?.phone) || normalizeTextValue(routed?.phoneNumber) || normalizeTextValue(routed?.mobile) || normalizeTextValue(routed?.mobileNumber) || (isTargetUserFetched ? (normalizeTextValue(fetched?.phone) || normalizeTextValue(fetched?.phoneNumber) || normalizeTextValue(fetched?.mobile) || normalizeTextValue(fetched?.mobileNumber)) : '')),
      mobileNumber: isViewingSelf
        ? (normalizeTextValue(fetched?.mobileNumber) || normalizeTextValue(fetched?.mobile) || normalizeTextValue(fetched?.phoneNumber) || normalizeTextValue(fetched?.phone) || normalizeTextValue(contextPhone) || normalizeTextValue(storedPhone) || '')
        : (normalizeTextValue(routed?.mobileNumber) || normalizeTextValue(routed?.mobile) || normalizeTextValue(routed?.phoneNumber) || normalizeTextValue(routed?.phone) || (isTargetUserFetched ? (normalizeTextValue(fetched?.mobileNumber) || normalizeTextValue(fetched?.mobile) || normalizeTextValue(fetched?.phoneNumber) || normalizeTextValue(fetched?.phone)) : '')),
      profileImageUrl: isViewingSelf
        ? (contextPrimaryImage || (ownImages[0] || null) || normalizeTextValue(fetched?.profileImageUrl))
        : (normalizeTextValue(routed?.profileImageUrl) || (isTargetUserFetched ? normalizeTextValue(fetched?.profileImageUrl) : '') || routeImage || (targetImages[0] || null)),
      images: mergedImages.length > 0 ? mergedImages : (routeImage ? [routeImage] : []),
    };
  }, [
    date,
    displayName,
    englishSkillLevel,
    fetchedProfile,
    ownGalleryImages,
    targetGalleryImages,
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
    isTargetUserFetched,
  ]);

  const targetPartyFromMatch = useMemo(() => {
    if (!matchingMatch || !numericTargetId) return null;
    const sId = matchingMatch?.sender?.id ?? matchingMatch?.sender?.userId;
    const rId = matchingMatch?.receiver?.id ?? matchingMatch?.receiver?.userId;
    if (isSameId(sId, numericTargetId)) return matchingMatch.sender;
    if (isSameId(rId, numericTargetId)) return matchingMatch.receiver;
    return null;
  }, [matchingMatch, numericTargetId]);

  const isProfileOfTarget = useCallback((obj: any) => {
    if (!obj) return false;
    const objId = obj?.id ?? obj?.userId ?? obj?.targetUserId;
    if (objId && numericTargetId && isSameId(objId, numericTargetId)) return true;
    if (myId && objId && isSameId(objId, myId)) return false;
    return Boolean(!myId && objId && numericTargetId && isSameId(objId, numericTargetId));
  }, [numericTargetId, myId]);

  const acceptedChatPhone = useMemo(() => {
    return extractPhone(
      isProfileOfTarget(routeProfileData) ? routeProfileData : null,
      isTargetUserFetched && isProfileOfTarget(fetchedProfile) ? fetchedProfile : null,
      matchingInvitation?.receiver,
      (matchingInvitation as any)?.receiverProfile,
      matchingReceived?.sender,
      (matchingReceived as any)?.senderProfile,
      targetPartyFromMatch
    );
  }, [routeProfileData, isTargetUserFetched, fetchedProfile, matchingInvitation, matchingReceived, targetPartyFromMatch, isProfileOfTarget]);

  const acceptedChatTg = useMemo(() => {
    return extractTelegram(
      isProfileOfTarget(routeProfileData) ? routeProfileData : null,
      isTargetUserFetched && isProfileOfTarget(fetchedProfile) ? fetchedProfile : null,
      matchingInvitation?.receiver,
      (matchingInvitation as any)?.receiverProfile,
      matchingReceived?.sender,
      (matchingReceived as any)?.senderProfile,
      targetPartyFromMatch
    );
  }, [routeProfileData, isTargetUserFetched, fetchedProfile, matchingInvitation, matchingReceived, targetPartyFromMatch, isProfileOfTarget]);

  const handleOpenAcceptedChat = useCallback(() => {
    const phone = acceptedChatPhone;
    const tg = acceptedChatTg;

    if (phone && tg) {
      Alert.alert(
        t('profile.contactdetails.choose_contact_method', { defaultValue: 'Choose Contact Method' }),
        t('profile.contactdetails.select_chat_app', { defaultValue: 'Would you like to chat via WhatsApp or Telegram?' }),
        [
          { text: 'WhatsApp', onPress: () => openWhatsAppUrl(phone) },
          { text: 'Telegram', onPress: () => openTelegramUrl(tg) },
          { text: t('common.cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
        ]
      );
    } else if (phone) {
      openWhatsAppUrl(phone);
    } else if (tg) {
      openTelegramUrl(tg);
    } else {
      Alert.alert(
        t('requests.requestsinboxscreen.accepted_request_title', { defaultValue: 'Invitation Accepted!' }),
        t('profile.userdetails.no_contact_alert', {
          defaultValue: `${mergedProfile?.name || 'Your match'} has accepted your invitation, but has not added her WhatsApp or Telegram yet.`,
        }),
        [{ text: t('common.ok', { defaultValue: 'OK' }) }]
      );
    }
  }, [acceptedChatPhone, acceptedChatTg, mergedProfile]);

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
        contentContainerStyle={[
          styles.scrollContent,
          !isViewingSelf && requestRole !== 'received'
            ? { paddingBottom: 90 + Math.max(insets.bottom, Platform.OS === 'android' ? 28 : 20) }
            : { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 28 : 24) },
        ]}
      >
        {/* Hero Photo Carousel */}
        <View style={styles.sliderWrapper}>
          {sliderImages.length > 0 ? (
            <View style={[styles.imageCard, { height: heroCardHeight }]}>
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
                blurRadius={!isViewingSelf && !effectiveIsSubscribed && !isViewerWoman ? (Platform.OS === 'android' ? 22 : 16) : 0}
              />

              {/* Tap navigation for slider */}
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

              {/* Upgrade to premium blur overlay card when viewing another user and not subscribed (men only) */}
              {!isViewingSelf && !effectiveIsSubscribed && !isViewerWoman && (
                <View style={styles.blurCardOverlayWrapper} pointerEvents="box-none">
                  <View style={styles.blurCardOverlay} pointerEvents="auto">
                    <TouchableOpacity
                      style={styles.upgradePillBtn}
                      activeOpacity={0.85}
                      onPress={openSubscriptionPlans}
                      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    >
                      <MaterialCommunityIcons name="crown" size={20} color="#FF4D6D" style={styles.crownIcon} />
                      <Text style={styles.upgradePillText}>{t('profile.viewmyprofilescreen.upgrade_to_premium')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
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
            <View style={[styles.emptyHero, { height: heroCardHeight }]}>
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

      {/* Sticky Bottom Full-Width Send Invite / Upgrade Pill (Hidden once match is accepted) */}
      {!isViewingSelf && requestRole !== 'received' && !isAcceptedMatch && (
        <View style={[styles.stickyBottomBar, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 26 : 20) }]}>
          <TouchableOpacity
            style={[
              styles.sendInvitePill,
              (!effectiveIsSubscribed && !isViewerWoman) && styles.upgradeBottomPill,
              (effectiveIsSubscribed || isViewerWoman) && (isPendingInvite || likeMutation.isPending) && styles.sendInvitePillDisabled,
            ]}
            activeOpacity={0.85}
            onPress={
              (!effectiveIsSubscribed && !isViewerWoman)
                ? openSubscriptionPlans
                : handleLike
            }
            disabled={
              (!effectiveIsSubscribed && !isViewerWoman)
                ? false
                : (isPendingInvite || likeMutation.isPending)
            }
          >
            {likeMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <View style={styles.sendInviteContent}>
                <MaterialCommunityIcons
                  name={
                    (!effectiveIsSubscribed && !isViewerWoman)
                      ? "crown"
                      : isPendingInvite
                      ? "check-circle-outline"
                      : "send"
                  }
                  size={19}
                  color="#FFFFFF"
                  style={styles.sendInviteIcon}
                />
                <Text style={styles.sendInviteText}>
                  {(!effectiveIsSubscribed && !isViewerWoman)
                    ? t('profile.viewmyprofilescreen.upgrade', { defaultValue: 'Upgrade' })
                    : isPendingInvite
                    ? t('profile.viewmyprofilescreen.invitation_sent')
                    : t('profile.viewmyprofilescreen.send_invite')}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}
      {AlertComponent}
      <SubscriptionModal
        visible={localPaywallVisible || Boolean(paywallVisible)}
        onClose={() => {
          setLocalPaywallVisible(false);
          setPaywallVisible?.(false);
        }}
      />
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
      height: 480,
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
      zIndex: 50,
      elevation: 10,
    },
    blurCardOverlay: {
      width: 240,
      height: 240,
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
      elevation: 8,
    },
    upgradePillBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#1E1924',
      paddingVertical: 12,
      paddingHorizontal: 22,
      borderRadius: 25,
      elevation: 10,
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowRadius: 6,
      zIndex: 60,
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
      height: 46,
      borderRadius: 23,
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
    upgradeBottomPill: {
      backgroundColor: colors.primary || '#7C3AED',
      shadowColor: colors.primary || '#7C3AED',
      shadowOpacity: 0.45,
      shadowRadius: 8,
      elevation: 6,
    },
    chatBottomPill: {
      backgroundColor: '#25D366',
      shadowColor: '#25D366',
      shadowOpacity: 0.45,
      shadowRadius: 8,
      elevation: 6,
    },
    telegramBottomPill: {
      backgroundColor: '#0088cc',
      shadowColor: '#0088cc',
      shadowOpacity: 0.45,
      shadowRadius: 8,
      elevation: 6,
    },
    sendInviteContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendInviteIcon: {
      marginRight: 7,
    },
    sendInviteText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
    },
  });


