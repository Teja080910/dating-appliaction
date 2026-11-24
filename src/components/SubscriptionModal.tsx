import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  useWindowDimensions,
  ActivityIndicator,
  StatusBar,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppContext from '../context/CreateGlobalStateContext';
import {
  useSubscription,
  toBackendPlanName,
  useSubscriberPlans,
  DEFAULT_SUBSCRIPTION_PLANS,
  normalizeBackendPlan,
  ClientSubscriptionPlan,
} from '../api/useSubscription';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserId } from '../utils/sessionHelper';
import RazorpayCheckout from 'react-native-razorpay';
import { useAlert } from './AlertModal';
import { SUPPORT_EMAIL } from '../environment/ApiConfig';
import { Colors, useTheme } from '../theme';
import { t, useTranslation } from '../i18n';

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
}

type SupportedPaymentMode = 'upi' | 'card' | 'netbanking' | 'wallet';
type RazorpayCheckoutOptions = Parameters<typeof RazorpayCheckout.open>[0];
type RazorpayCheckoutResponse = Awaited<ReturnType<typeof RazorpayCheckout.open>>;

const FALLBACK_DEFAULT_PLANS: ClientSubscriptionPlan[] = [
  {
    id: 'STANDARD',
    canonicalId: 'STANDARD',
    type: 'STANDARD',
    label: 'Standard',
    name: 'Standard',
    price: '₹1',
    amount: 1,
    unit: '',
    billedText: '120 Days',
    subText: '10 requests/day',
    durationDays: 120,
    dailyRequestLimit: 10,
    unlimited: false,
    limitLabel: '10 requests/day',
    contactView: '10',
    tagline: 'Invite up to 10 members per day',
    description: 'Standard Plan: 10 daily connection requests for 120 days.',
    worldwideSearch: false,
    eliteBadge: false,
    priorityHandoff: false,
    popular: false,
    bestValue: false,
    badge: undefined,
  },
  {
    id: 'PREMIUM',
    canonicalId: 'PREMIUM',
    type: 'PREMIUM',
    label: 'Premium',
    name: 'Premium',
    price: '₹2',
    amount: 2,
    unit: '',
    billedText: '180 Days',
    subText: '20 requests/day',
    durationDays: 180,
    dailyRequestLimit: 20,
    unlimited: false,
    limitLabel: '20 requests/day',
    contactView: '20',
    tagline: 'Invite up to 20 members per day',
    description: 'Premium Plan: 20 daily connection requests for 180 days.',
    worldwideSearch: false,
    eliteBadge: false,
    priorityHandoff: false,
    popular: true,
    bestValue: false,
    badge: 'POPULAR',
  },
  {
    id: 'ELITE',
    canonicalId: 'ELITE',
    type: 'ELITE',
    label: 'Elite',
    name: 'Elite',
    price: '₹3',
    amount: 3,
    unit: '',
    billedText: '365 Days',
    subText: 'Unlimited requests',
    durationDays: 365,
    dailyRequestLimit: null,
    unlimited: true,
    limitLabel: 'Unlimited requests',
    contactView: 'UNLIMITED',
    tagline: 'Invite unlimited members per day',
    description: 'Elite Plan: unlimited daily connection requests for 365 days.',
    worldwideSearch: false,
    eliteBadge: false,
    priorityHandoff: false,
    popular: false,
    bestValue: true,
    badge: 'BEST VALUE',
  },
];

const getPlans = (): ClientSubscriptionPlan[] => {
  if (Array.isArray(DEFAULT_SUBSCRIPTION_PLANS) && typeof normalizeBackendPlan === 'function') {
    return DEFAULT_SUBSCRIPTION_PLANS.map(normalizeBackendPlan);
  }
  return FALLBACK_DEFAULT_PLANS;
};

type BenefitSlide = {
  id: string;
  icon: string;
  iconFamily?: 'mci' | 'ionicons';
  iconColor: string;
  badgeBackground?: string;
  badgeBorderColor?: string;
  title: string;
  subtitle: string;
};

const getBenefitSlides = (colors: any): BenefitSlide[] => [
  {
    id: '1',
    icon: 'heart-outline',
    iconColor: colors.primary,
    title: t('common.subscriptionmodal.become_a_premium_member'),
    subtitle: t('common.subscriptionmodal.connect_daily_members', {
      defaultValue: 'Send daily connection requests to members.',
    }),
  },
  {
    id: '2',
    icon: 'star-outline',
    iconColor: colors.secondary,
    title: t('common.subscriptionmodal.premium_profile'),
    subtitle: t(
      'common.subscriptionmodal.stand_out_with_a_premium_badge_and_priority_placement_in_search'
    ),
  },
  {
    id: '3',
    icon: 'globe-outline',
    iconFamily: 'ionicons',
    iconColor: colors.info,
    badgeBackground: 'rgba(59, 130, 246, 0.14)',
    badgeBorderColor: 'rgba(59, 130, 246, 0.30)',
    title: t('common.subscriptionmodal.worldwide_search'),
    subtitle: t(
      'common.subscriptionmodal.find_matches_anywhere_in_the_world_not_just_your_local_area'
    ),
  },
  {
    id: '4',
    icon: 'shield-check-outline',
    iconColor: colors.success,
    title: t('common.subscriptionmodal.verified_safe'),
    subtitle: t(
      'common.subscriptionmodal.all_members_are_verified_enjoy_a_safer_higher_quality_experience'
    ),
  },
];

const getPaymentMethods = (): Array<{
  id: SupportedPaymentMode;
  label: string;
  subtitle: string;
  icon: string;
}> => [
  {
    id: 'upi',
    label: t('common.razorpaymock.upi'),
    subtitle: t('common.subscriptionmodal.google_pay_phonepe'),
    icon: 'qrcode-scan',
  },
  {
    id: 'card',
    label: t('common.subscriptionmodal.card'),
    subtitle: t('common.subscriptionmodal.visa_mastercard_rupay'),
    icon: 'credit-card-outline',
  },
  {
    id: 'netbanking',
    label: t('common.razorpaymock.net_banking'),
    subtitle: t('common.subscriptionmodal.all_indian_banks'),
    icon: 'bank-outline',
  },
  {
    id: 'wallet',
    label: t('common.razorpaymock.wallet'),
    subtitle: t('common.subscriptionmodal.paytm_mobikwik'),
    icon: 'wallet-outline',
  },
];

const normalizeTextValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized || null;
};

const normalizeDigitsOnly = (value: unknown) => {
  const normalized = normalizeTextValue(value);
  if (!normalized) {
    return null;
  }

  const digits = normalized.replace(/\D/g, '');
  return digits || null;
};

const resolveCheckoutAmount = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }

  const normalized = normalizeTextValue(value);
  if (!normalized) {
    return null;
  }

  const digitsOnly = normalized.replace(/[^\d]/g, '');
  if (/^\d+$/.test(digitsOnly)) {
    const parsedDigits = Number(digitsOnly);
    return Number.isFinite(parsedDigits) && parsedDigits > 0
      ? parsedDigits
      : null;
  }

  const parsedNumber = Number(normalized);
  return Number.isFinite(parsedNumber) && parsedNumber > 0
    ? Math.round(parsedNumber)
    : null;
};

const resolveCheckoutMethod = (
  value: unknown
): SupportedPaymentMode | null => {
  const normalized = normalizeTextValue(value)?.toLowerCase();

  if (!normalized) {
    return null;
  }

  if (normalized === 'upi') {
    return 'upi';
  }

  if (normalized === 'card' || normalized === 'cards') {
    return 'card';
  }

  if (
    normalized === 'netbanking' ||
    normalized === 'net banking' ||
    normalized === 'bank'
  ) {
    return 'netbanking';
  }

  if (normalized === 'wallet' || normalized === 'wallets') {
    return 'wallet';
  }

  return null;
};

const normalizeNotes = (
  value: unknown
): Record<string | number, string> | undefined => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .map(([key, item]) => [key, normalizeTextValue(item)] as const)
    .filter((entry): entry is readonly [string, string] => Boolean(entry[1]));

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
};

const resolveNestedObject = (value: unknown) =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const resolveRazorpayOrderId = (...values: unknown[]) => {
  for (const value of values) {
    const normalized = normalizeTextValue(value);
    if (!normalized) {
      continue;
    }

    if (
      normalized.startsWith('order_') ||
      normalized.startsWith('orderId_') ||
      normalized.toLowerCase().includes('razorpay')
    ) {
      return normalized;
    }
  }

  // Fallback to any valid non-empty string identifier
  for (const value of values) {
    const normalized = normalizeTextValue(value);
    if (normalized && normalized !== 'null' && normalized !== 'undefined') {
      return normalized;
    }
  }

  return null;
};

const normalizeOrderResponse = (orderData: any) => {
  const dataPayload = resolveNestedObject(orderData?.data);
  const orderPayload =
    resolveNestedObject(orderData?.order) ||
    resolveNestedObject(dataPayload?.order) ||
    dataPayload;
  const prefillPayload =
    resolveNestedObject(orderData?.prefill) ||
    resolveNestedObject(dataPayload?.prefill) ||
    resolveNestedObject(orderPayload?.prefill);
  const themePayload =
    resolveNestedObject(orderData?.theme) ||
    resolveNestedObject(dataPayload?.theme) ||
    resolveNestedObject(orderPayload?.theme);

  return {
    key:
      normalizeTextValue(orderData?.key) ||
      normalizeTextValue(orderData?.keyId) ||
      normalizeTextValue(orderData?.key_id) ||
      normalizeTextValue(orderData?.razorpayKey) ||
      normalizeTextValue(orderData?.razorpay_key) ||
      normalizeTextValue(dataPayload?.key) ||
      normalizeTextValue(dataPayload?.keyId) ||
      normalizeTextValue(dataPayload?.key_id) ||
      normalizeTextValue(dataPayload?.razorpayKey) ||
      normalizeTextValue(orderPayload?.key) ||
      normalizeTextValue(orderPayload?.keyId) ||
      normalizeTextValue(orderPayload?.key_id),
    orderId:
      resolveRazorpayOrderId(
        orderData?.order_id,
        orderData?.orderId,
        orderData?.razorpayOrderId,
        orderData?.id,
        dataPayload?.order_id,
        dataPayload?.orderId,
        dataPayload?.razorpayOrderId,
        dataPayload?.id,
        orderPayload?.order_id,
        orderPayload?.orderId,
        orderPayload?.razorpayOrderId,
        orderPayload?.id,
      ),
    amount:
      resolveCheckoutAmount(orderData?.amount) ||
      resolveCheckoutAmount(orderData?.amountValue) ||
      resolveCheckoutAmount(dataPayload?.amount) ||
      resolveCheckoutAmount(dataPayload?.amountValue) ||
      resolveCheckoutAmount(dataPayload?.amount_due) ||
      resolveCheckoutAmount(orderPayload?.amount) ||
      resolveCheckoutAmount(orderPayload?.amountValue),
    currency:
      normalizeTextValue(orderData?.currency) ||
      normalizeTextValue(dataPayload?.currency) ||
      normalizeTextValue(orderPayload?.currency) ||
      t('common.subscriptionmodal.inr'),
    name:
      normalizeTextValue(orderData?.name) ||
      normalizeTextValue(dataPayload?.name) ||
      normalizeTextValue(orderPayload?.name) ||
      'AMARA',
    description:
      normalizeTextValue(orderData?.description) ||
      normalizeTextValue(dataPayload?.description) ||
      normalizeTextValue(orderPayload?.description),
    image:
      normalizeTextValue(orderData?.image) ||
      normalizeTextValue(dataPayload?.image) ||
      normalizeTextValue(orderPayload?.image),
    prefill: {
      name:
        normalizeTextValue(prefillPayload?.name) ||
        normalizeTextValue(orderData?.name),
      email: normalizeTextValue(prefillPayload?.email),
      contact:
        normalizeDigitsOnly(prefillPayload?.contact) ||
        normalizeDigitsOnly(prefillPayload?.phone),
      method:
        resolveCheckoutMethod(prefillPayload?.method) ||
        resolveCheckoutMethod(orderData?.paymentMode) ||
        resolveCheckoutMethod(orderData?.paymentMethod) ||
        resolveCheckoutMethod(orderData?.method),
    },
    notes:
      normalizeNotes(orderData?.notes) ||
      normalizeNotes(orderPayload?.notes),
    theme: {
      color:
        normalizeTextValue(themePayload?.color) ||
        normalizeTextValue(orderData?.themeColor),
      backdropColor:
        normalizeTextValue(themePayload?.backdrop_color) ||
        normalizeTextValue(themePayload?.backdropColor),
      hideTopbar:
        typeof themePayload?.hide_topbar === 'boolean'
          ? themePayload.hide_topbar
          : typeof themePayload?.hideTopbar === 'boolean'
            ? themePayload.hideTopbar
            : undefined,
    },
  };
};

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  visible,
  onClose,
}) => {
  useTranslation();
  const { themeColors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(themeColors, isDark), [themeColors, isDark]);
  const { width: screenWidth } = useWindowDimensions();
  const { alert, AlertComponent } = useAlert();
  const { setIsSubscribed, isSubscribed, displayName, name, email, phoneNumber, gender, authUserId } =
    useContext(AppContext);
  const subHook = useSubscription();
  const {
    createOrder,
    verifyPayment,
    subscriptionStatus,
    refetchStatus,
  } = subHook;
  const subscriberPlansHook = typeof useSubscriberPlans === 'function' ? useSubscriberPlans() : null;
  const plans: ClientSubscriptionPlan[] = useMemo(() => {
    const list = subscriberPlansHook?.data || subHook?.plans;
    return Array.isArray(list) && list.length > 0 ? list : getPlans();
  }, [subscriberPlansHook?.data, subHook?.plans]);
  const [loading, setLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('PREMIUM');
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [activeDaysLeft, setActiveDaysLeft] = useState<number | null>(null);
  const [activeEndDate, setActiveEndDate] = useState<string | null>(null);
  const [selectedPaymentMode, setSelectedPaymentMode] =
    useState<SupportedPaymentMode | 'all'>('all');
  const [activeSlide, setActiveSlide] = useState(0);
  const [isWoman, setIsWoman] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    let isMounted = true;
    const checkGender = async () => {
      try {
        const activeGender = String(gender || '').trim().toLowerCase();
        if (activeGender) {
          if (isMounted) {
            setIsWoman(activeGender.includes('woman') || activeGender.includes('female'));
          }
          return;
        }

        const [g1, g2, u, userData] = await Promise.all([
          AsyncStorage.getItem('selectedGender'),
          AsyncStorage.getItem('userGender'),
          AsyncStorage.getItem('user'),
          AsyncStorage.getItem('userData'),
        ]);
        let found = g1 || g2 || '';
        if (!found) {
          for (const json of [u, userData]) {
            if (json) {
              try {
                const parsed = JSON.parse(json);
                const candidate = parsed?.gender || parsed?.user?.gender || parsed?.profile?.gender;
                if (candidate) {
                  found = candidate;
                  break;
                }
              } catch {}
            }
          }
        }
        const raw = String(found || '').toLowerCase();
        if (isMounted) {
          setIsWoman(raw.includes('woman') || raw.includes('female'));
        }
      } catch {}
    };
    void checkGender();
    return () => {
      isMounted = false;
    };
  }, [gender]);

  useEffect(() => {
    if (visible && isWoman) {
      onClose();
    }
  }, [visible, isWoman, onClose]);

  useEffect(() => {
    if (!visible || isWoman) {
      return;
    }

    setLoading(false);
    setSelectedPaymentMode('all');
    setActiveSlide(0);

    refetchStatus?.();
    const loadActiveSub = async () => {
      try {
        const uid = (await getUserId().catch(() => null)) || authUserId;
        const [userScopedSub, userScopedPlan, userScopedDays, userScopedEnd] = await Promise.all([
          uid ? AsyncStorage.getItem(`isSubscribed_${uid}`) : null,
          uid ? AsyncStorage.getItem(`@subscription_plan_${uid}`) : null,
          uid ? AsyncStorage.getItem(`@subscription_remainingDays_${uid}`) : null,
          uid ? AsyncStorage.getItem(`@subscription_endDate_${uid}`) : null,
        ]);

        const rawPlan = subscriptionStatus?.plan || userScopedPlan;
        const isActive = Boolean(subscriptionStatus?.active || userScopedSub === 'true');
        if (isActive && rawPlan) {
          const normPlan = toBackendPlanName(rawPlan);
          setActivePlan(normPlan);
          setSelectedPlanId(normPlan);
          const days =
            subscriptionStatus?.remainingDays !== undefined && subscriptionStatus?.remainingDays !== null
              ? subscriptionStatus.remainingDays
              : userScopedDays
              ? parseInt(userScopedDays, 10)
              : null;
          setActiveDaysLeft(days);
          setActiveEndDate(subscriptionStatus?.endDate || userScopedEnd || null);
        } else {
          setActivePlan(null);
          setActiveDaysLeft(null);
          setActiveEndDate(null);
          setSelectedPlanId('PREMIUM');
        }
      } catch {
        setSelectedPlanId('PREMIUM');
      }
    };
    void loadActiveSub();
  }, [visible, isWoman, isSubscribed, subscriptionStatus?.active, subscriptionStatus?.plan]);

  useEffect(() => {
    if (!visible || isWoman) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => {
        const next = (prev + 1) % getBenefitSlides(themeColors).length;
        try {
          flatListRef.current?.scrollToIndex({ index: next, animated: true });
        } catch {
          // ignore scroll errors
        }
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [visible, isWoman, themeColors]);

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / screenWidth);
    if (
      index >= 0 &&
      index < getBenefitSlides(themeColors).length &&
      index !== activeSlide
    ) {
      setActiveSlide(index);
    }
  };

  const selectedPlan = useMemo(() => {
    return plans.find((p) => p.id === selectedPlanId) || plans[0] || getPlans()[0];
  }, [plans, selectedPlanId]);

  const isSelectedActive = Boolean(activePlan && activePlan === selectedPlanId);

  const completePaymentVerification = async (
    orderId: string,
    paymentId: string,
    signature: string,
    planId: string
  ) => {
    try {
      setLoading(true);
      const backendPlan = toBackendPlanName(planId);

      // The backend is the single source of truth. Never grant premium locally
      // if the payment signature could not be verified.
      await verifyPayment.mutateAsync({
        orderId,
        paymentId,
        signature,
        plan: backendPlan,
      });

      setIsSubscribed(true);
      await AsyncStorage.setItem('isSubscribed', 'true');
      await AsyncStorage.setItem('@subscription_plan', backendPlan);
      const activatedPlan = plans.find((plan) => plan.id === planId) || plans[0] || getPlans()[0];
      const durationDays = activatedPlan?.durationDays || 120;
      const endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
      await AsyncStorage.setItem('@subscription_endDate', endDate);
      await AsyncStorage.setItem('@subscription_remainingDays', String(durationDays));
      setActivePlan(backendPlan);
      setActiveDaysLeft(durationDays);
      setActiveEndDate(endDate);
      refetchStatus?.();

      onClose();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        t('common.subscriptionmodal.payment_verification_failed');
      console.warn('[Subscription] Payment verification failed:', message);
      alert(t('common.subscriptionmodal.payment_failed'), String(message));
      refetchStatus?.();
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradePress = async () => {
    if (loading) return;

    if (isSelectedActive) {
      alert(
        'Active Subscription',
        `You currently have the ${selectedPlan.name} Plan active (${activeDaysLeft !== null ? `${activeDaysLeft} days remaining` : 'Active'}). Would you like to extend your plan?`,
        [
          { text: t('profile.additionaluploadsection.cancel'), style: 'cancel', onPress: () => setLoading(false) },
          {
            text: 'Extend Plan',
            onPress: () => {
              void executeCheckout();
            },
          },
        ]
      );
      return;
    }

    await executeCheckout();
  };

  const executeCheckout = async () => {
    try {
      setLoading(true);

      if (!selectedPlanId) {
        alert(t('profile.additionaluploadsection.error'), t('common.subscriptionmodal.please_select_a_plan'));
        setLoading(false);
        return;
      }

      let normalizedOrder: any = null;
      try {
        const orderData = await createOrder.mutateAsync({
          plan: selectedPlanId,
        });
        normalizedOrder = normalizeOrderResponse(orderData);
      } catch (orderErr: any) {
        console.warn('[SubscriptionModal] Create order failed:', orderErr);
        alert(
          t('common.subscriptionmodal.payment_failed'),
          orderErr?.response?.data?.message ||
            orderErr?.message ||
            t('common.subscriptionmodal.something_went_wrong')
        );
        return;
      }

      if (!normalizedOrder?.orderId || !normalizedOrder?.amount || !normalizedOrder?.key) {
        alert(
          t('common.subscriptionmodal.payment_failed'),
          t('common.subscriptionmodal.something_went_wrong')
        );
        return;
      }

      const prefillName =
        normalizeTextValue(
          normalizedOrder.prefill.name || displayName || name || t('common.subscriptionmodal.amara_user')
        ) || t('common.subscriptionmodal.amara_user');
      const prefillEmail =
        normalizeTextValue(normalizedOrder.prefill.email || email) || undefined;
      const prefillContact =
        normalizeDigitsOnly(normalizedOrder.prefill.contact || phoneNumber) ||
        undefined;

      const options: RazorpayCheckoutOptions = {
        key: normalizedOrder.key,
        amount: normalizedOrder.amount,
        currency: normalizedOrder.currency,
        name: normalizedOrder.name,
        description:
          normalizedOrder.description || t('common.subscriptionmodal.amara_plan', { selectedPlanId }),
        image:
          normalizedOrder.image ||
          'https://cdn-icons-png.flaticon.com/512/2111/2111646.png',
        order_id:
          normalizedOrder.orderId ||
          (normalizedOrder as any).razorpayOrderId ||
          (normalizedOrder as any).id,
        prefill: {
          name: prefillName,
          ...(prefillEmail ? { email: prefillEmail } : {}),
          ...(prefillContact ? { contact: prefillContact } : {}),
          ...(selectedPaymentMode !== 'all'
            ? { method: selectedPaymentMode }
            : {}),
        },
        theme: {
          color: normalizedOrder.theme.color || Colors.primary,
        },
        notes: {
          ...(normalizedOrder.notes || {}),
          plan: selectedPlanId,
          paymentMode: selectedPaymentMode,
        },
        modal: {
          backdropclose: false,
          handleback: true,
          confirm_close: true,
        },
        retry: {
          enabled: true,
          max_count: 2,
        },
      };

      const paymentData: RazorpayCheckoutResponse = await RazorpayCheckout.open(options);

      await completePaymentVerification(
        paymentData.razorpay_order_id,
        paymentData.razorpay_payment_id,
        paymentData.razorpay_signature,
        selectedPlanId
      );
    } catch (error: any) {
      console.warn('Payment Error:', error?.message || error);
      const backendMessage =
        error?.response?.data?.message ||
        error?.description ||
        error?.message ||
        t('common.subscriptionmodal.something_went_wrong');

      if (
        error?.code === 0 ||
        error?.code === 2 ||
        /cancelled|canceled/i.test(backendMessage)
      ) {
        alert(t('common.subscriptionmodal.cancelled'), t('common.subscriptionmodal.payment_cancelled'));
        return;
      }

      if (
        backendMessage === 'User not found' ||
        error?.response?.status === 404 ||
        error?.response?.status === 401
      ) {
        alert(
          t('common.subscriptionmodal.sync_needed'),
          t('common.subscriptionmodal.were_having_trouble_confirming_your_account_serv'),
          [
            { text: t('profile.additionaluploadsection.cancel'), onPress: () => setLoading(false) },
            { text: t('common.subscriptionmodal.retry_anyway'), onPress: () => handleUpgradePress() },
          ]
        );
        return;
      }

      alert(t('common.subscriptionmodal.payment_failed'), backendMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!visible || isWoman) {
    return null;
  }

  return (
    <Modal
      visible={visible && !isWoman}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={themeColors.background} />

        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Icon name="chevron-left" size={30} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('common.subscriptionmodal.get_premium')}</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Benefit Slides */}
          <View style={styles.carouselSection}>
            <FlatList
              ref={flatListRef}
              data={getBenefitSlides(themeColors)}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleScroll}
              renderItem={({ item }) => {
                const slideIcon =
                  item.iconFamily === 'ionicons' ? (
                    <Ionicons name={item.icon} size={50} color={item.iconColor} />
                  ) : (
                    <Icon name={item.icon} size={50} color={item.iconColor} />
                  );
                return (
                  <View style={[styles.slideItem, { width: screenWidth }]}>
                    {item.badgeBackground ? (
                      <View
                        style={[
                          styles.heroBadge,
                          {
                            backgroundColor: item.badgeBackground,
                            borderColor: item.badgeBorderColor || item.badgeBackground,
                          },
                        ]}
                      >
                        {slideIcon}
                      </View>
                    ) : (
                      <LinearGradient
                        colors={[...themeColors.gradientCard]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.heroBadge}
                      >
                        {slideIcon}
                      </LinearGradient>
                    )}
                    <Text style={styles.heroTitle}>{item.title}</Text>
                    <Text style={styles.heroSubtitle}>{item.subtitle}</Text>
                  </View>
                );
              }}
            />
          </View>

          {/* Plans Heading */}
          <View style={styles.plansSection}>
            <Text style={styles.sectionTitle}>
              {t('common.subscriptionmodal.get_amara_premium')}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {t('common.subscriptionmodal.choose_your_plan')}
            </Text>
          </View>

          {/* Plan Cards */}
          <View style={styles.plansRow}>
            {plans.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              const isActivePlan = activePlan === plan.id;
              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.planCard,
                    isSelected && styles.selectedPlanCard,
                    isActivePlan && !isSelected && styles.activePlanCardBorder,
                  ]}
                  onPress={() => setSelectedPlanId(plan.id)}
                  activeOpacity={0.85}
                >
                  {isActivePlan ? (
                    <View style={[styles.badgeContainer, styles.activeCardBadge]}>
                      <Icon name="check" size={11} color="#FFFFFF" style={{ marginRight: 3 }} />
                      <Text style={styles.badgeText}>ACTIVE PLAN</Text>
                    </View>
                  ) : plan.badge ? (
                    <View
                      style={[
                        styles.badgeContainer,
                        isSelected ? styles.badgeSelected : styles.badgeUnselected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          isSelected && styles.badgeTextSelected,
                        ]}
                      >
                        {plan.badge}
                      </Text>
                    </View>
                  ) : null}

                  <Text
                    style={[
                      styles.planLabel,
                      isSelected && styles.selectedPlanLabel,
                    ]}
                  >
                    {plan.label}
                  </Text>

                  <View style={styles.priceContainer}>
                    <Text
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={[
                        styles.planPrice,
                        isSelected && styles.selectedPlanPrice,
                      ]}
                    >
                      {plan.price}
                    </Text>
                    {plan.unit ? (
                      <Text
                        style={[
                          styles.planUnit,
                          isSelected && styles.selectedPlanUnit,
                        ]}
                      >
                        /{plan.unit}
                      </Text>
                    ) : null}
                  </View>

                  {plan.subText ? (
                    <Text
                      style={[
                        styles.planSubText,
                        isSelected && styles.selectedPlanSubText,
                      ]}
                    >
                      {plan.subText}
                    </Text>
                  ) : null}

                  <Text
                    style={[
                      styles.planBilledText,
                      isSelected && styles.selectedPlanBilledText,
                    ]}
                  >
                    {plan.billedText}
                  </Text>

                  {isActivePlan ? (
                    <View style={[styles.activeStatusPill, isSelected && styles.activeStatusPillSelected]}>
                      <Text style={[styles.activeStatusPillText, isSelected && styles.activeStatusPillTextSelected]}>
                        {activeDaysLeft !== null ? `${activeDaysLeft} days left` : 'Active Plan'}
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Plan note / disclaimer */}
          <Text style={styles.disclaimerText}>
            {isSelectedActive
              ? t('common.subscriptionmodal.plan_active_days_remaining', {
                  plan: selectedPlan.name,
                  days: activeDaysLeft ?? 0,
                  defaultValue: `You currently have the ${selectedPlan.name} Plan active (${activeDaysLeft !== null ? `${activeDaysLeft} days remaining` : 'Active'}).`,
                })
              : selectedPlan.description || (
                  selectedPlanId === 'ELITE'
                    ? t('common.subscriptionmodal.elite_plan_desc', { defaultValue: 'Elite Plan: Unlimited daily connection requests for 365 days.' })
                    : selectedPlanId === 'PREMIUM'
                    ? t('common.subscriptionmodal.premium_plan_desc', { defaultValue: 'Premium Plan: 20 daily connection requests for 180 days.' })
                    : t('common.subscriptionmodal.standard_plan_desc', { defaultValue: 'Standard Plan: 10 daily connection requests for 120 days.' })
                )}
          </Text>

          {/* Subscribe CTA */}
          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={handleUpgradePress}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={
                isSelectedActive
                  ? ['#059669', '#10B981']
                  : [...themeColors.gradientPrimary]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.subscribeGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {isSelectedActive && (
                    <Icon name="check-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  )}
                  <Text style={styles.subscribeButtonText}>
                    {isSelectedActive
                      ? t('common.subscriptionmodal.plan_active', {
                          plan: selectedPlan?.label,
                          defaultValue: `Active Plan (${selectedPlan?.label})`,
                        })
                      : t('common.subscriptionmodal.subscribe')}
                  </Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Support Footer */}
          <TouchableOpacity
            style={styles.supportFooter}
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
            activeOpacity={0.7}
          >
            <Text style={styles.supportFooterText}>
              {t('common.subscriptionmodal.need_help')}{' '}
              <Text style={styles.supportFooterLink}>
                Chat with us {SUPPORT_EMAIL}
              </Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      {/* Razorpay Interactive Payment Sheet */}
      {AlertComponent}
    </Modal>
  );
};

function createStyles(colors: any, isDark: boolean = true) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border || colors.glassBorder,
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
    headerTitle: {
      fontSize: 19,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: -0.2,
    },
    headerPlaceholder: {
      width: 40,
    },
    scrollContent: {
      paddingBottom: 28,
    },
    carouselSection: {
      marginTop: 32,
      alignItems: 'center',
    },
    slideItem: {
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingHorizontal: 32,
    },
    heroBadge: {
      width: 104,
      height: 104,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 58, 237, 0.12)',
    },
    heroTitle: {
      fontSize: 26,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
      letterSpacing: -0.3,
      marginBottom: 12,
    },
    heroSubtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    plansSection: {
      alignItems: 'center',
      paddingHorizontal: 24,
      marginTop: 36,
    },
    sectionTitle: {
      fontSize: 26,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
      letterSpacing: -0.3,
    },
    sectionSubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 6,
    },
    plansRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'stretch',
      alignSelf: 'center',
      width: '100%',
      maxWidth: 480,
      paddingHorizontal: 20,
      marginTop: 30,
      gap: 12,
    },
    planCard: {
      flex: 1,
      backgroundColor: isDark ? colors.surface : '#FFFFFF',
      borderRadius: 18,
      paddingTop: 26,
      paddingBottom: 20,
      paddingHorizontal: 6,
      alignItems: 'center',
      justifyContent: 'flex-start',
      minHeight: 178,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E5E7EB',
      position: 'relative',
      overflow: 'visible',
    },
    selectedPlanCard: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 5,
    },
    activePlanCardBorder: {
      borderColor: '#10B981',
      borderWidth: 2,
    },
    activeCardBadge: {
      backgroundColor: '#10B981',
      flexDirection: 'row',
      alignItems: 'center',
    },
    activeStatusPill: {
      marginTop: 8,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#D1FAE5',
    },
    activeStatusPillSelected: {
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
    activeStatusPillText: {
      color: '#10B981',
      fontSize: 10,
      fontWeight: '700',
    },
    activeStatusPillTextSelected: {
      color: '#FFFFFF',
    },
    badgeContainer: {
      position: 'absolute',
      top: -11,
      alignSelf: 'center',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      zIndex: 2,
    },
    badgeUnselected: {
      backgroundColor: colors.secondary || colors.primary,
    },
    badgeSelected: {
      backgroundColor: '#FFFFFF',
    },
    badgeText: {
      color: '#FFFFFF',
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 0.4,
    },
    badgeTextSelected: {
      color: colors.primary,
    },
    planLabel: {
      fontSize: 11.5,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    selectedPlanLabel: {
      color: 'rgba(255, 255, 255, 0.95)',
    },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'center',
      marginTop: 10,
      width: '100%',
    },
    planPrice: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text,
      maxWidth: '100%',
    },
    selectedPlanPrice: {
      color: '#FFFFFF',
    },
    planUnit: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      marginLeft: 2,
    },
    selectedPlanUnit: {
      color: 'rgba(255, 255, 255, 0.9)',
    },
    planSubText: {
      fontSize: 11.5,
      fontWeight: '600',
      color: colors.text,
      marginTop: 10,
      textAlign: 'center',
    },
    selectedPlanSubText: {
      color: '#FFFFFF',
    },
    planBilledText: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 5,
      textAlign: 'center',
    },
    selectedPlanBilledText: {
      color: 'rgba(255, 255, 255, 0.85)',
    },
    disclaimerText: {
      fontSize: 13.5,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginTop: 26,
      paddingHorizontal: 28,
    },
    subscribeButton: {
      marginHorizontal: 20,
      marginTop: 26,
      height: 56,
      borderRadius: 28,
      overflow: 'hidden',
      elevation: 4,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
    },
    subscribeGradient: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    subscribeButtonText: {
      color: '#FFFFFF',
      fontSize: 17,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    supportFooter: {
      marginTop: 22,
      marginBottom: 24,
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    supportFooterText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    supportFooterLink: {
      color: colors.primaryLight || colors.primary,
      fontWeight: '600',
    },
  });
}

export default SubscriptionModal;
