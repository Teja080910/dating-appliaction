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
  NativeScrollEvent,
  NativeSyntheticEvent,
  PanResponder,
  Platform,
  Pressable,
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
import { USE_MOCK } from "../../environment/ApiConfig";
import { openWhatsAppChat, extractPhone, extractTelegram } from "../../utils/whatsappHelper";
import { filterSupportedLanguages } from "../../utils/languageHelper";

import { getAuthToken, getUserId } from "../../utils/sessionHelper";
import { getUserFriendlyMessage, isSubscriptionGateError } from "../../utils/userFriendlyMessages";
import { RootParamList } from "../../utils/types/navigation.types";
import { t, useTranslation } from '../../i18n';
import { calculateAgeFromDob, getAgeFromDob } from '../../utils/dateUtils';

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
  const cardWidth = Math.max(Math.round(screenWidth - 32), 200);
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
  const [myId, setMyId] = useState<string | null>(null);
  const [storedPhone, setStoredPhone] = useState<string>('');
  const [storedTelegram, setStoredTelegram] = useState<string>('');
  const { data: myTgStatus } = useMyTelegramStatus();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const activeUid = myId || (await getUserId().catch(() => null)) || (await AsyncStorage.getItem('userId'));
        const [p1, p2, p3, tg] = await Promise.all([
          AsyncStorage.getItem('phoneNumber'),
          AsyncStorage.getItem('userMobile'),
          activeUid ? AsyncStorage.getItem(`user_phone_${activeUid}`).catch(() => null) : null,
          activeUid ? AsyncStorage.getItem(`user_telegram_${activeUid}`).catch(() => null) : null,
        ]);
        if (isMounted) {
          const isPhoneRemovedGlobal = (await AsyncStorage.getItem('@amara_phone_removed_global').catch(() => null)) === 'true';
          const isPhoneRemovedUid = activeUid ? (await AsyncStorage.getItem(`@amara_phone_removed_${activeUid}`).catch(() => null)) === 'true' : false;
          const isPhoneRemoved = isPhoneRemovedGlobal || isPhoneRemovedUid;

          const isTgRemovedGlobal = (await AsyncStorage.getItem('@amara_telegram_disconnected_global').catch(() => null)) === 'true';
          const isTgRemovedUid = activeUid ? (await AsyncStorage.getItem(`@amara_telegram_disconnected_${activeUid}`).catch(() => null)) === 'true' : false;
          const isTgRemoved = isTgRemovedGlobal || isTgRemovedUid;

          const effPhone = isPhoneRemoved ? '' : (p3 || p1 || p2 || '');
          const effTg = isTgRemoved ? '' : (tg ? tg.replace(/^@+/, '') : '');

          setStoredPhone(effPhone);
          setStoredTelegram(effTg);
        }
      } catch {}
    })();
    return () => {
      isMounted = false;
    };
  }, [myId]);

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
  const styles = useMemo(() => createStyles(themeColors, isDark, cardWidth), [themeColors, isDark, cardWidth]);
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

          // 3. Fallback to mock store (mock mode only)
          if (!apiActive && USE_MOCK) {
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
            if (USE_MOCK) {
              await mockStore.activateSubscription(String(currentUserId), planName);
            }
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

  const [deletedUris, setDeletedUris] = useState<string[]>([]);
  const loadDeletedUris = useCallback(async () => {
    try {
      const activeUid = myId || (await getUserId().catch(() => null));
      if (activeUid) {
        const raw = await AsyncStorage.getItem(`deleted_photos_${activeUid}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setDeletedUris(parsed.map(String));
          }
        }
      }
    } catch {}
  }, [myId]);

  useEffect(() => {
    void loadDeletedUris();
  }, [loadDeletedUris]);

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
      void loadDeletedUris();
      void refetchProfileRef.current?.();
      void connectionRef.current?.sentList?.refetch?.();
      void connectionRef.current?.receivedList?.refetch?.();
      void connectionRef.current?.connectionList?.refetch?.();

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
      } else if (numericTargetId) {
        getAllImagesRef.current(String(numericTargetId), {
          onSuccess: (data: any) => {
            setTargetGalleryImages(dedupeImageUris([data]));
          },
        });
      }
    }, [isViewingSelf, myId, numericTargetId, setSelectedNetWorth, setSelectedKids, loadDeletedUris]),
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('AMARA_PROFILE_UPDATED', async (event?: any) => {
      void loadDeletedUris();
      void refetchProfileRef.current?.();
      try {
        const activeUid = event?.uid || myId || (await getUserId().catch(() => null)) || (await AsyncStorage.getItem('userId'));
        const [p1, p2, p3, tg] = await Promise.all([
          AsyncStorage.getItem('phoneNumber'),
          AsyncStorage.getItem('userMobile'),
          activeUid ? AsyncStorage.getItem(`user_phone_${activeUid}`).catch(() => null) : null,
          activeUid ? AsyncStorage.getItem(`user_telegram_${activeUid}`).catch(() => null) : null,
        ]);
        const isPhoneRemovedGlobal = (await AsyncStorage.getItem('@amara_phone_removed_global').catch(() => null)) === 'true';
        const isPhoneRemovedUid = activeUid ? (await AsyncStorage.getItem(`@amara_phone_removed_${activeUid}`).catch(() => null)) === 'true' : false;
        const isPhoneRemoved = isPhoneRemovedGlobal || isPhoneRemovedUid || event?.phoneNumber === '';

        const isTgRemovedGlobal = (await AsyncStorage.getItem('@amara_telegram_disconnected_global').catch(() => null)) === 'true';
        const isTgRemovedUid = activeUid ? (await AsyncStorage.getItem(`@amara_telegram_disconnected_${activeUid}`).catch(() => null)) === 'true' : false;
        const isTgRemoved = isTgRemovedGlobal || isTgRemovedUid || event?.telegramUsername === '';

        const effPhone = isPhoneRemoved ? '' : (event?.phoneNumber !== undefined ? event.phoneNumber : (p3 || p1 || p2 || ''));
        const effTg = isTgRemoved ? '' : (event?.telegramUsername !== undefined ? event.telegramUsername : (tg ? tg.replace(/^@+/, '') : ''));

        setStoredPhone(effPhone);
        setStoredTelegram(effTg);
      } catch {}
      if (isViewingSelf && myId) {
        getAllImagesRef.current(String(myId), {
          onSuccess: (data: any) => {
            setOwnGalleryImages(dedupeImageUris([data]));
          },
        });
      } else if (!isViewingSelf && numericTargetId && isSameId(event?.uid, numericTargetId)) {
        getAllImagesRef.current(String(numericTargetId), {
          onSuccess: (data: any) => {
            setTargetGalleryImages(dedupeImageUris([data]));
          },
        });
      }
    });
    return () => {
      sub.remove();
    };
  }, [isViewingSelf, myId, loadDeletedUris]);

  const prevTargetIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (numericTargetId && prevTargetIdRef.current !== numericTargetId) {
      setTargetGalleryImages([]); // Clear only when actually switching to a different target profile
      prevTargetIdRef.current = numericTargetId;
    }

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

  const sliderScrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

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
            const sub = USE_MOCK ? await mockStore.getSubscriptionStatus(String(myId)) : null;
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
    // Server DOB is authoritative when available so a birthday changed on
    // another device appears here. The local context date is only the offline
    // fallback.
    const fetchedDob = (fetchedProfile as any)?.dob;
    const ageFromFetchedDob = fetchedDob ? getAgeFromDob(fetchedDob) : null;
    if (ageFromFetchedDob) return ageFromFetchedDob;
    if (date) {
      const calc = calculateAgeFromDob(date);
      if (calc > 0) return calc;
    }
    return fetchedProfile?.age || null;
  }, [date, fetchedProfile?.age, fetchedProfile?.dob]);

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

    const filterOutDeleted = (list: (string | null | undefined)[]) => {
      if (!deletedUris || deletedUris.length === 0) return dedupeImageUris(list);
      return dedupeImageUris(list).filter((uri) => {
        if (!uri) return false;
        const clean = uri.trim();
        const abs = getAbsoluteUrl(clean) || clean;
        return !deletedUris.some((d) => {
          if (!d) return false;
          const cleanD = String(d).trim();
          if (!cleanD) return false;
          if (cleanD === clean || cleanD === abs) return true;
          const dAbs = getAbsoluteUrl(cleanD) || cleanD;
          return dAbs === abs || dAbs === clean;
        });
      });
    };

    const activeContextPhotos = filterOutDeleted(contextImages || []);
    const fetchedPhotos = filterOutDeleted([
      fetched?.photos,
      fetched?.images,
      fetched?.profile?.photos,
      fetched?.profile?.images,
    ]);
    const ownGallery = filterOutDeleted(ownGalleryImages || []);
    const liveTargetGallery = filterOutDeleted(targetGalleryImages || []);

    // Merge all authoritative and routed sources so every uploaded image is preserved:
    // 1. targetGalleryImages (fetched live from /users/{userId}/images)
    // 2. fetchedPhotos & fetchedImages (fetched live from /profile/get or /profile/me)
    // 3. routed photos/images from card navigation
    const targetImages = dedupeImageUris([
      liveTargetGallery,
      fetchedPhotos,
      routed?.photos,
      routed?.images,
      routed?.allImages,
      routed?.profileImageUrl,
      routeImage,
    ]).filter((uri) => filterOutDeleted([uri]).length > 0);

    const ownImages = dedupeImageUris([
      activeContextPhotos,
      ownGallery,
      fetchedPhotos,
      profileImageUrl,
      profileImage,
    ]).filter((uri) => filterOutDeleted([uri]).length > 0);

    const mergedImages = isViewingSelf ? ownImages : targetImages;

    const baseData = isViewingSelf
      ? { ...routed, ...fetched }
      : (isTargetUserFetched ? { ...routed, ...fetched } : { ...routed });

    const selfPhone = (() => {
      const isPhoneCleared =
        fetched?.phoneNumber === '' ||
        fetched?.mobile === '' ||
        (contextPhone === '' && !storedPhone);
      if (isPhoneCleared) return '';
      return (
        normalizeTextValue(storedPhone) ||
        normalizeTextValue(contextPhone) ||
        normalizeTextValue(fetched?.phoneNumber) ||
        normalizeTextValue(fetched?.mobile) ||
        normalizeTextValue(fetched?.phone) ||
        normalizeTextValue(fetched?.mobileNumber) ||
        ''
      );
    })();

    return {
      ...baseData,
      id: (isViewingSelf ? (fetched?.id || myId) : ((isTargetUserFetched ? fetched?.id : null) || numericTargetId || routed?.id)) || null,
      targetUserId: isViewingSelf ? null : ((isTargetUserFetched ? (fetched?.userId || fetched?.id) : null) || numericTargetId || routed?.targetUserId || routed?.userId || null),
      name: isViewingSelf
        ? (normalizeTextValue(displayName) || normalizeTextValue(name) || normalizeTextValue(fetched?.displayName) || normalizeTextValue(fetched?.name) || t('home.usercard.user'))
        : (isTargetUserFetched ? (normalizeTextValue(fetched?.displayName) || normalizeTextValue(fetched?.name)) : (normalizeTextValue(routed?.displayName) || normalizeTextValue(routed?.name) || t('home.usercard.user'))),
      displayName: isViewingSelf
        ? (normalizeTextValue(displayName) || normalizeTextValue(name) || normalizeTextValue(fetched?.displayName) || normalizeTextValue(fetched?.name) || t('home.usercard.user'))
        : (isTargetUserFetched ? (normalizeTextValue(fetched?.displayName) || normalizeTextValue(fetched?.name)) : (normalizeTextValue(routed?.displayName) || normalizeTextValue(routed?.name) || t('home.usercard.user'))),
      age: isViewingSelf
        ? (ownAge || fetched?.age || null)
        : (isTargetUserFetched ? (fetched?.age || null) : (routed?.age || null)),
      bio: isViewingSelf
        ? (normalizeTextValue(profileText) || normalizeTextValue(fetched?.bio) || '')
        : (isTargetUserFetched ? normalizeTextValue(fetched?.bio) : (normalizeTextValue(routed?.bio) || '')),
      height: isViewingSelf
        ? (fetched?.height || height || null)
        : (isTargetUserFetched ? (fetched?.height || null) : (routed?.height || null)),
      appearance: isViewingSelf
        ? (normalizeTextValue(fetched?.appearance) || normalizeTextValue(selectedAppearance) || '')
        : (isTargetUserFetched ? normalizeTextValue(fetched?.appearance) : (normalizeTextValue(routed?.appearance) || '')),
      bodyType: isViewingSelf
        ? (normalizeTextValue(fetched?.bodyType) || normalizeTextValue(selectedBodyType) || '')
        : (isTargetUserFetched ? normalizeTextValue(fetched?.bodyType) : (normalizeTextValue(routed?.bodyType) || '')),
      language: isViewingSelf
        ? filterSupportedLanguages(fetched?.language || contextLanguage).join(', ')
        : filterSupportedLanguages(isTargetUserFetched ? fetched?.language : (routed?.language || t('profile.userdetails.english'))).join(', '),
      englishLevel: isViewingSelf
        ? (normalizeTextValue(fetched?.englishLevel) || contextEnglishLevel || '')
        : (isTargetUserFetched ? normalizeTextValue(fetched?.englishLevel) : (normalizeTextValue(routed?.englishLevel) || t('profile.viewmyprofilescreen.conversational'))),
      ethnicity: isViewingSelf
        ? (normalizeTextValue(fetched?.ethnicity) || normalizeTextValue(selectedEthinicity) || '')
        : (isTargetUserFetched ? normalizeTextValue(fetched?.ethnicity) : (normalizeTextValue(routed?.ethnicity) || t('profile.viewmyprofilescreen.asian'))),
      smoke: isViewingSelf
        ? (normalizeTextValue(fetched?.smoke) || normalizeTextValue(selectedSmoking) || '')
        : (isTargetUserFetched ? normalizeTextValue(fetched?.smoke) : (normalizeTextValue(routed?.smoke) || t('profile.viewmyprofilescreen.never'))),
      drink: isViewingSelf
        ? (normalizeTextValue(fetched?.drink) || normalizeTextValue(selectedDrinking) || '')
        : (isTargetUserFetched ? normalizeTextValue(fetched?.drink) : (normalizeTextValue(routed?.drink) || t('profile.viewmyprofilescreen.socially'))),
      lookingFor: isViewingSelf
        ? (normalizeTextValue(fetched?.lookingFor) || contextLookingFor || '')
        : (isTargetUserFetched ? normalizeTextValue(fetched?.lookingFor) : (normalizeTextValue(routed?.lookingFor) || t('profile.viewmyprofilescreen.long_term'))),
      kidCount: isViewingSelf
        ? (normalizeTextValue(fetched?.kidCount) || normalizeTextValue(fetched?.kids) || normalizeTextValue(selectedKids) || '')
        : (isTargetUserFetched ? (normalizeTextValue(fetched?.kidCount) || normalizeTextValue(fetched?.kids) || '') : (normalizeTextValue(routed?.kidCount) || normalizeTextValue(routed?.kids) || '')),
      kids: isViewingSelf
        ? (normalizeTextValue(fetched?.kids) || normalizeTextValue(fetched?.kidCount) || normalizeTextValue(selectedKids) || '')
        : (isTargetUserFetched ? (normalizeTextValue(fetched?.kids) || normalizeTextValue(fetched?.kidCount) || '') : (normalizeTextValue(routed?.kids) || normalizeTextValue(routed?.kidCount) || '')),
      netWorth: isViewingSelf
        ? (normalizeTextValue(fetched?.netWorth) || normalizeTextValue(selectedNetWorth) || '')
        : (isTargetUserFetched ? (normalizeTextValue(fetched?.netWorth) || '') : (normalizeTextValue(routed?.netWorth) || '')),
      currentCity: isViewingSelf
        ? (normalizeTextValue(fetched?.currentCity) || normalizeTextValue(location) || '')
        : (isTargetUserFetched ? (normalizeTextValue(fetched?.currentCity) || normalizeTextValue(fetched?.city) || t('home.usercard.nearby')) : (normalizeTextValue(routed?.currentCity) || normalizeTextValue(routed?.city) || t('home.usercard.nearby'))),
      location: isViewingSelf
        ? (normalizeTextValue(fetched?.location) || normalizeTextValue(location) || '')
        : (isTargetUserFetched ? (normalizeTextValue(fetched?.location) || normalizeTextValue(fetched?.currentCity) || '') : (normalizeTextValue(routed?.location) || normalizeTextValue(routed?.place) || '')),
      place: (isTargetUserFetched ? fetched?.place : null) || routed?.place || fetched?.place || null,
      neighborhood: (isTargetUserFetched ? fetched?.neighborhood : null) || routed?.neighborhood || fetched?.neighborhood || null,
      area: (isTargetUserFetched ? fetched?.area : null) || routed?.area || fetched?.area || null,
      lastActive: (isTargetUserFetched ? fetched?.lastActive : null) || routed?.lastActive || fetched?.lastActive || null,
      online: Boolean((isTargetUserFetched ? fetched?.online : null) ?? routed?.online ?? fetched?.online ?? false),
      distance: isViewingSelf
        ? ''
        : ((isTargetUserFetched ? fetched?.distance : '') || routed?.distance || ''),
      distanceKm: isViewingSelf
        ? null
        : ((isTargetUserFetched ? fetched?.distanceKm : null) ?? routed?.distanceKm ?? null),
      latitude: (isTargetUserFetched ? (fetched?.latitude ?? fetched?.lat) : null) ?? routed?.latitude ?? fetched?.latitude ?? routed?.lat ?? fetched?.lat ?? null,
      longitude: (isTargetUserFetched ? (fetched?.longitude ?? fetched?.lng) : null) ?? routed?.longitude ?? fetched?.longitude ?? routed?.lng ?? fetched?.lng ?? null,
      verifiedSelfie: isViewingSelf
        ? Boolean(fetched?.verifiedSelfie ?? fetched?.selfieVerified ?? verifiedSelfie)
        : Boolean((isTargetUserFetched ? (fetched?.verifiedSelfie ?? fetched?.selfieVerified) : null) ?? routed?.verifiedSelfie ?? routed?.selfieVerified),
      telegramUsername: isViewingSelf
        ? (() => {
            const isTgCleared =
              fetched?.telegramUsername === '' ||
              fetched?.telegramUsername === 'NONE' ||
              (!storedTelegram && (myTgStatus?.isConnected === false || !myTgStatus?.telegramUsername));
            if (isTgCleared) return '';
            return (
              normalizeTextValue(storedTelegram) ||
              normalizeTextValue(fetched?.telegramUsername) ||
              normalizeTextValue(myTgStatus?.telegramUsername) ||
              ''
            );
          })()
        : (isViewerWoman || !isAcceptedMatch ? '' : (isTargetUserFetched ? normalizeTextValue(fetched?.telegramUsername) : normalizeTextValue(routed?.telegramUsername))),
      phoneNumber: isViewingSelf
        ? selfPhone
        : (isViewerWoman || !isAcceptedMatch ? '' : (isTargetUserFetched ? (normalizeTextValue(fetched?.phoneNumber) || normalizeTextValue(fetched?.mobile) || normalizeTextValue(fetched?.phone) || normalizeTextValue(fetched?.mobileNumber)) : (normalizeTextValue(routed?.phoneNumber) || normalizeTextValue(routed?.mobile) || normalizeTextValue(routed?.phone) || normalizeTextValue(routed?.mobileNumber)))),
      mobile: isViewingSelf
        ? selfPhone
        : (isViewerWoman || !isAcceptedMatch ? '' : (isTargetUserFetched ? (normalizeTextValue(fetched?.mobile) || normalizeTextValue(fetched?.phoneNumber) || normalizeTextValue(fetched?.phone) || normalizeTextValue(fetched?.mobileNumber)) : (normalizeTextValue(routed?.mobile) || normalizeTextValue(routed?.phoneNumber) || normalizeTextValue(routed?.phone) || normalizeTextValue(routed?.mobileNumber)))),
      phone: isViewingSelf
        ? selfPhone
        : (isViewerWoman || !isAcceptedMatch ? '' : (isTargetUserFetched ? (normalizeTextValue(fetched?.phone) || normalizeTextValue(fetched?.phoneNumber) || normalizeTextValue(fetched?.mobile) || normalizeTextValue(fetched?.mobileNumber)) : (normalizeTextValue(routed?.phone) || normalizeTextValue(routed?.phoneNumber) || normalizeTextValue(routed?.mobile) || normalizeTextValue(routed?.mobileNumber)))),
      mobileNumber: isViewingSelf
        ? selfPhone
        : (isViewerWoman || !isAcceptedMatch ? '' : (isTargetUserFetched ? (normalizeTextValue(fetched?.mobileNumber) || normalizeTextValue(fetched?.mobile) || normalizeTextValue(fetched?.phoneNumber) || normalizeTextValue(fetched?.phone)) : (normalizeTextValue(routed?.mobileNumber) || normalizeTextValue(routed?.mobile) || normalizeTextValue(routed?.phoneNumber) || normalizeTextValue(routed?.phone)))),
      profileImageUrl: isViewingSelf
        ? (contextPrimaryImage || (ownImages[0] || null) || normalizeTextValue(fetched?.profileImageUrl))
        : (isTargetUserFetched && fetched?.profileImageUrl ? normalizeTextValue(fetched.profileImageUrl) : (normalizeTextValue(routed?.profileImageUrl) || routeImage || (targetImages[0] || null))),
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
    deletedUris,
    contextPhone,
    storedPhone,
    storedTelegram,
    myTgStatus,
    isAcceptedMatch,
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
    if (isViewerWoman) return '';
    if (isTargetUserFetched && isProfileOfTarget(fetchedProfile)) {
      if (
        (fetchedProfile as any)?.mobile === '' ||
        (fetchedProfile as any)?.phoneNumber === '' ||
        (fetchedProfile as any)?.phone === ''
      ) {
        return '';
      }
    }
    return extractPhone(
      isTargetUserFetched && isProfileOfTarget(fetchedProfile) ? fetchedProfile : null,
      targetPartyFromMatch,
      isProfileOfTarget(routeProfileData) ? routeProfileData : null,
      matchingInvitation?.receiver,
      (matchingInvitation as any)?.receiverProfile,
      matchingReceived?.sender,
      (matchingReceived as any)?.senderProfile
    );
  }, [isViewerWoman, routeProfileData, isTargetUserFetched, fetchedProfile, matchingInvitation, matchingReceived, targetPartyFromMatch, isProfileOfTarget]);

  const acceptedChatTg = useMemo(() => {
    if (isViewerWoman) return '';
    if (isTargetUserFetched && isProfileOfTarget(fetchedProfile)) {
      if (
        (fetchedProfile as any)?.telegramUsername === '' ||
        (fetchedProfile as any)?.telegramUsername === 'NONE'
      ) {
        return '';
      }
    }
    return extractTelegram(
      isTargetUserFetched && isProfileOfTarget(fetchedProfile) ? fetchedProfile : null,
      targetPartyFromMatch,
      isProfileOfTarget(routeProfileData) ? routeProfileData : null,
      matchingInvitation?.receiver,
      (matchingInvitation as any)?.receiverProfile,
      matchingReceived?.sender,
      (matchingReceived as any)?.senderProfile
    );
  }, [isViewerWoman, routeProfileData, isTargetUserFetched, fetchedProfile, matchingInvitation, matchingReceived, targetPartyFromMatch, isProfileOfTarget]);

  const handleOpenAcceptedChat = useCallback(() => {
    const phone = acceptedChatPhone;
    const tg = acceptedChatTg;

    if (phone && tg) {
      Alert.alert(
        t('profile.contactdetails.choose_contact_method', { defaultValue: 'Choose Contact Method' }),
        t('profile.contactdetails.select_chat_app', { defaultValue: 'Would you like to chat via WhatsApp or Telegram?' }),
        [
          { text: 'WhatsApp', onPress: () => openWhatsAppUrl(phone) },
          { text: t('nav.bottomtabs.telegram', { defaultValue: 'Telegram' }), onPress: () => openTelegramUrl(tg) },
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

  const hasProfileData = Boolean(
    mergedProfile?.name ||
    mergedProfile?.displayName ||
    routeProfileData?.name ||
    routeProfileData?.displayName ||
    fetchedProfile?.name ||
    fetchedProfile?.displayName
  );

  if (loading && !hasProfileData) {
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
      : (mergedProfile?.images && mergedProfile.images.length > 0
          ? mergedProfile.images
          : dedupeImageUris([
              mergedProfile?.profileImageUrl,
              routeImage,
            ]))
  ).map((image: string | null | undefined) => getAbsoluteUrl(image));
  const sliderImages =
    profileImages.length > 0
      ? profileImages
      : fallbackImage
        ? [fallbackImage]
        : [];

  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  const scrollToNext = useCallback(() => {
    if (sliderImages.length <= 1) return;
    const current = activeIndexRef.current;
    const next = current + 1 < sliderImages.length ? current + 1 : 0;
    setActiveIndex(next);
    sliderScrollRef.current?.scrollTo({
      x: next * cardWidth,
      animated: true,
    });
  }, [sliderImages.length, cardWidth]);

  const scrollToPrev = useCallback(() => {
    if (sliderImages.length <= 1) return;
    const current = activeIndexRef.current;
    const prev = current > 0 ? current - 1 : sliderImages.length - 1;
    setActiveIndex(prev);
    sliderScrollRef.current?.scrollTo({
      x: prev * cardWidth,
      animated: true,
    });
  }, [sliderImages.length, cardWidth]);

  const handleHeroScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / cardWidth);
      if (index >= 0 && index < sliderImages.length && index !== activeIndexRef.current) {
        setActiveIndex(index);
      }
    },
    [cardWidth, sliderImages.length]
  );

  const cardPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return (
            Math.abs(gestureState.dx) > 10 &&
            Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
          );
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx < -25) {
            scrollToNext();
          } else if (gestureState.dx > 25) {
            scrollToPrev();
          }
        },
      }),
    [scrollToNext, scrollToPrev]
  );

  useEffect(() => {
    if (activeIndex >= sliderImages.length && sliderImages.length > 0) {
      setActiveIndex(0);
      sliderScrollRef.current?.scrollTo({ x: 0, animated: false });
    }
  }, [sliderImages.length, activeIndex]);

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
              <ScrollView
                ref={sliderScrollRef}
                horizontal
                pagingEnabled={Platform.OS === 'ios'}
                snapToInterval={cardWidth}
                snapToAlignment="start"
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled={true}
                scrollEventThrottle={16}
                onScroll={handleHeroScroll}
                onMomentumScrollEnd={handleHeroScroll}
                style={{ width: cardWidth, height: heroCardHeight }}
                contentContainerStyle={{ width: cardWidth * sliderImages.length, height: heroCardHeight }}
              >
                {sliderImages.map((img: any, index: number) => {
                  const cleanUrl = typeof img === 'string' ? getAbsoluteUrl(img) : null;
                  const source = typeof img === 'string'
                    ? isApiHostedUrl(cleanUrl!)
                      ? {
                          uri: cleanUrl!,
                          headers: {
                            'ngrok-skip-browser-warning': '69420',
                            'User-Agent': 'AMARA-App',
                            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                          },
                        }
                      : { uri: cleanUrl! }
                    : img;

                  return (
                    <Pressable
                      key={index}
                      onPress={(e) => {
                        if (sliderImages.length <= 1) return;
                        const x = e.nativeEvent.locationX;
                        if (x < cardWidth * 0.35) {
                          scrollToPrev();
                        } else if (x > cardWidth * 0.65) {
                          scrollToNext();
                        }
                      }}
                      style={{ width: cardWidth, height: heroCardHeight }}
                    >
                      <Image
                        source={source}
                        style={styles.image}
                        resizeMode="cover"
                      />

                      {/* Upgrade card travels with its own photo so the blurred
                          backdrop always matches the image it sits on. */}
                      {!isViewingSelf && !effectiveIsSubscribed && !isViewerWoman && (
                        <View style={styles.blurCardOverlayWrapper} pointerEvents="box-none">
                          <View
                            style={styles.blurCardOverlay}
                            {...cardPanResponder.panHandlers}
                          >
                            <View style={styles.blurCardImage} pointerEvents="none">
                              <Image
                                source={source}
                                style={StyleSheet.absoluteFill}
                                blurRadius={26}
                                resizeMode="cover"
                              />
                            </View>
                            <View style={styles.blurCardTint} pointerEvents="none" />
                            <TouchableOpacity
                              style={styles.upgradePillBtn}
                              activeOpacity={0.85}
                              onPress={openSubscriptionPlans}
                              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            >
                              <MaterialCommunityIcons name="crown" size={20} color="#FF4D6D" style={styles.crownIcon} />
                              <Text style={styles.upgradePillText}>{t('profile.viewmyprofilescreen.upgrade_to_premium')}</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>

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

const createStyles = (colors: any, isDark: boolean = true, cardWidth: number = 360) =>
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
      width: Math.min(Math.max(cardWidth * 0.85, 260), 340),
      aspectRatio: 1,
      borderRadius: 30,
      overflow: 'hidden',
      backgroundColor: isDark ? '#1A1622' : '#F3E9EC',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 12,
    },
    blurCardImage: {
      ...StyleSheet.absoluteFillObject,
    },
    blurCardTint: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isDark ? 'rgba(28, 22, 34, 0.36)' : 'rgba(255, 255, 255, 0.2)',
    },
    upgradePillBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#2A2230',
      paddingVertical: 15,
      paddingHorizontal: 28,
      borderRadius: 30,
      elevation: 6,
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowRadius: 6,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    crownIcon: {
      marginRight: 9,
    },
    upgradePillText: {
      color: '#FFFFFF',
      fontSize: 16,
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


