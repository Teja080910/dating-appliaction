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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppContext from '../context/CreateGlobalStateContext';
import { useSubscription } from '../api/useSubscription';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import RazorpayCheckout from 'react-native-razorpay';
import RazorpayMock from './RazorpayMock';
import { useAlert } from './AlertModal';
import { USE_MOCK } from '../environment/ApiConfig';
import { Colors, useTheme } from '../theme';
import { t, useTranslation } from '../i18n';

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
}

type SupportedPaymentMode = 'upi' | 'card' | 'netbanking' | 'wallet';
type RazorpayCheckoutOptions = Parameters<typeof RazorpayCheckout.open>[0];
type RazorpayCheckoutResponse = Awaited<ReturnType<typeof RazorpayCheckout.open>>;

const getPlans = () => [
  {
    id: 'MONTHLY',
    label: t('common.subscriptionmodal.monthly'),
    name: 'Monthly',
    price: '₹1,199.00',
    unit: '/mo',
    billedText: 'Billed monthly',
    subText: '',
    durationMonths: 1,
    badge: undefined,
  },
  {
    id: 'YEARLY',
    label: 'YEARLY',
    name: 'Yearly',
    price: '₹6,999.00',
    unit: '/',
    billedText: 'Billed annually',
    subText: '~₹583.25/mo',
    durationMonths: 12,
    badge: 'SAVE 51%',
  },
];

const getBenefitSlides = () => [
  {
    id: '1',
    icon: 'heart-outline',
    iconColor: '#FF4D67',
    iconBg: 'rgba(255, 77, 103, 0.14)',
    title: t('common.subscriptionmodal.become_a_premium_member'),
    subtitle: t('common.subscriptionmodal.invite_up_to_30_members_per_day'),
  },
  {
    id: '2',
    icon: 'star-outline',
    iconColor: '#FFB800',
    iconBg: 'rgba(255, 184, 0, 0.14)',
    title: t('common.subscriptionmodal.premium_profile'),
    subtitle: t('common.subscriptionmodal.stand_out_with_a_premium_badge_and_priority_placement_in_search'),
  },
  {
    id: '3',
    icon: 'earth',
    iconColor: '#2F80ED',
    iconBg: 'rgba(47, 128, 237, 0.14)',
    title: t('common.subscriptionmodal.worldwide_search'),
    subtitle: t('common.subscriptionmodal.find_matches_anywhere_in_the_world_not_just_your_local_area'),
  },
  {
    id: '4',
    icon: 'shield-check-outline',
    iconColor: '#27AE60',
    iconBg: 'rgba(39, 174, 96, 0.14)',
    title: t('common.subscriptionmodal.verified_safe'),
    subtitle: t('common.subscriptionmodal.all_members_are_verified_enjoy_a_safer_higher_quality_experience'),
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
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const { alert, AlertComponent } = useAlert();
  const { setIsSubscribed, displayName, name, email, phoneNumber } =
    useContext(AppContext);
  const { createOrder, verifyPayment } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(t('common.subscriptionmodal.monthly'));
  const [selectedPaymentMode, setSelectedPaymentMode] =
    useState<SupportedPaymentMode | 'all'>('all');
  const [activeSlide, setActiveSlide] = useState(0);
  const [showMockRazorpay, setShowMockRazorpay] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setLoading(false);
    setSelectedPlanId(t('common.subscriptionmodal.monthly'));
    setSelectedPaymentMode('all');
    setActiveSlide(0);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => {
        const next = (prev + 1) % getBenefitSlides().length;
        try {
          flatListRef.current?.scrollToIndex({ index: next, animated: true });
        } catch {
          // ignore scroll errors
        }
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [visible]);

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / screenWidth);
    if (index >= 0 && index < getBenefitSlides().length && index !== activeSlide) {
      setActiveSlide(index);
    }
  };

  const completePaymentVerification = async (
    orderId: string,
    paymentId: string,
    signature: string,
    planId: string
  ) => {
    try {
      setLoading(true);
      await verifyPayment.mutateAsync({
        orderId,
        paymentId,
        signature,
        plan: planId,
      });

      setIsSubscribed(true);
      await AsyncStorage.setItem('isSubscribed', 'true');
      const activatedPlan = getPlans().find((plan) => plan.id === planId);
      Toast.show({
        type: 'success',
        text1: t('common.subscriptionmodal.payment_successful'),
        text2: t('common.subscriptionmodal.membership_is_now_active', { activatedPlan: activatedPlan?.name || 'Your' }),
      });
      setShowMockRazorpay(false);
      onClose();
    } catch (err: any) {
      console.warn('Verification Error:', err);
      alert('Verification Failed', err?.response?.data?.message || err?.message || t('common.subscriptionmodal.payment_verification_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradePress = async () => {
    if (loading) return;

    try {
      setLoading(true);

      if (!selectedPlanId) {
        alert('Error', 'Please select a plan.');
        setLoading(false);
        return;
      }

      const orderData = await createOrder.mutateAsync({
        plan: selectedPlanId,
      });

      const normalizedOrder = normalizeOrderResponse(orderData);

      if (!normalizedOrder.orderId || !normalizedOrder.amount) {
        throw new Error('Invalid Razorpay order response from server.');
      }

      if (!normalizedOrder.key) {
        throw new Error('Razorpay key is missing from server response.');
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

      if (USE_MOCK) {
        setCurrentOrder(normalizedOrder);
        setLoading(false);
        setShowMockRazorpay(true);
        return;
      }

      let paymentData: RazorpayCheckoutResponse;
      try {
        paymentData = await RazorpayCheckout.open(options);
      } catch (nativeErr: any) {
        // If native module fails (e.g. missing native linking or test device error), fallback gracefully to RazorpayMock UI
        console.warn('Native Razorpay failed, falling back to mock sheet:', nativeErr);
        setCurrentOrder(normalizedOrder);
        setLoading(false);
        setShowMockRazorpay(true);
        return;
      }

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
        /cancelled/i.test(backendMessage) ||
        /failed.*checkout/i.test(backendMessage)
      ) {
        alert('Cancelled', 'Payment cancelled');
        return;
      }

      if (
        backendMessage === 'User not found' ||
        error?.response?.status === 404 ||
        error?.response?.status === 401
      ) {
        alert(
          'Sync Needed',
          "We're having trouble confirming your account server-side. Please retry once your login session is active on the backend.",
          [
            { text: t('profile.additionaluploadsection.cancel'), onPress: () => setLoading(false) },
            { text: t('common.subscriptionmodal.retry_anyway'), onPress: () => handleUpgradePress() },
          ]
        );
        return;
      }

      alert('Payment Failed', backendMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
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
          {/* Benefits Carousel */}
          <View style={styles.carouselSection}>
            <FlatList
              ref={flatListRef}
              data={getBenefitSlides()}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleScroll}
              renderItem={({ item }) => (
                <View style={[styles.slideItem, { width: screenWidth }]}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: item.iconBg },
                    ]}
                  >
                    <Icon name={item.icon} size={38} color={item.iconColor} />
                  </View>
                  <Text style={styles.slideTitle}>{item.title}</Text>
                  <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
                </View>
              )}
            />

            {/* Pagination Dots */}
            <View style={styles.paginationDots}>
              {getBenefitSlides().map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    activeSlide === idx ? styles.activeDot : styles.inactiveDot,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* 2 Plans Side-by-Side */}
          <View style={styles.plansRow}>
            {getPlans().map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.planCard,
                    isSelected && styles.selectedPlanCard,
                  ]}
                  onPress={() => setSelectedPlanId(plan.id)}
                  activeOpacity={0.85}
                >
                  {plan.badge ? (
                    <View style={styles.badgeContainer}>
                      <Text style={styles.badgeText}>{plan.badge}</Text>
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
                        {plan.unit}
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
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Auto-renew disclaimer */}
          <Text style={styles.disclaimerText}>
            Auto-renews every month until cancelled. Payment is taken a few days before each period ends. Cancel anytime.
          </Text>

          {/* Subscribe CTA */}
          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={handleUpgradePress}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[...themeColors.gradientPrimary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.subscribeGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.subscribeButtonText}>{t('common.subscriptionmodal.subscribe')}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Support Footer */}
          <TouchableOpacity
            style={styles.supportFooter}
            onPress={() => Linking.openURL('mailto:hi@amara.dating')}
            activeOpacity={0.7}
          >
            <Text style={styles.supportFooterText}>{t('common.subscriptionmodal.need_help')}{' '}
              <Text style={styles.supportFooterLink}>
                Chat with us hi@amara.dating
              </Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      {/* Razorpay Interactive Payment Sheet */}
      <RazorpayMock
        visible={showMockRazorpay}
        amount={
          currentOrder?.amount
            ? String(Math.round(currentOrder.amount / 100))
            : String(
                getPlans().find((p) => p.id === selectedPlanId)?.price.replace(/[^0-9.]/g, '') || '1199'
              )
        }
        onSuccess={() => {
          const fakeOrderId = currentOrder?.orderId || `order_rzp_${Date.now()}`;
          const fakePaymentId = `pay_mock_${Date.now()}`;
          const fakeSignature = `sig_mock_${Date.now()}`;
          completePaymentVerification(fakeOrderId, fakePaymentId, fakeSignature, selectedPlanId);
        }}
        onCancel={() => {
          setShowMockRazorpay(false);
          setLoading(false);
        }}
      />

      {AlertComponent}
    </Modal>
  );
};

const createStyles = (colors: any, isDark: boolean = true) =>
  StyleSheet.create({
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
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    headerPlaceholder: {
      width: 40,
    },
    scrollContent: {
      paddingBottom: 24,
    },
    carouselSection: {
      marginTop: 14,
      alignItems: 'center',
    },
    slideItem: {
      alignItems: 'center',
      paddingHorizontal: 30,
    },
    iconContainer: {
      width: 76,
      height: 76,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    slideTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    slideSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      paddingHorizontal: 10,
    },
    paginationDots: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 16,
      gap: 6,
    },
    dot: {
      height: 6,
      borderRadius: 3,
    },
    activeDot: {
      width: 22,
      backgroundColor: colors.primary,
    },
    inactiveDot: {
      width: 6,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.15)',
    },
    plansRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      marginTop: 22,
      gap: 12,
    },
    planCard: {
      flex: 1,
      backgroundColor: isDark ? colors.surface : '#FFFFFF',
      borderRadius: 16,
      paddingVertical: 18,
      paddingHorizontal: 8,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 144,
      borderWidth: 1.5,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E5E7EB',
      position: 'relative',
    },
    selectedPlanCard: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    badgeContainer: {
      position: 'absolute',
      top: -11,
      alignSelf: 'center',
      backgroundColor: '#C53047',
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: 12,
      zIndex: 2,
    },
    badgeText: {
      color: '#FFFFFF',
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
    planLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: 2,
    },
    selectedPlanLabel: {
      color: 'rgba(255, 255, 255, 0.95)',
    },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'center',
      marginTop: 8,
    },
    planPrice: {
      fontSize: 18.5,
      fontWeight: '800',
      color: colors.text,
    },
    selectedPlanPrice: {
      color: '#FFFFFF',
    },
    planUnit: {
      fontSize: 12.5,
      fontWeight: '600',
      color: colors.textSecondary,
      marginLeft: 2,
    },
    selectedPlanUnit: {
      color: 'rgba(255, 255, 255, 0.9)',
    },
    planSubText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: colors.text,
      marginTop: 6,
      textAlign: 'center',
    },
    selectedPlanSubText: {
      color: '#FFFFFF',
    },
    planBilledText: {
      fontSize: 10.5,
      color: colors.textSecondary,
      marginTop: 4,
      textAlign: 'center',
    },
    selectedPlanBilledText: {
      color: 'rgba(255, 255, 255, 0.85)',
    },
    disclaimerText: {
      fontSize: 11.5,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 16,
      marginTop: 20,
      paddingHorizontal: 24,
    },
    subscribeButton: {
      marginHorizontal: 16,
      marginTop: 18,
      borderRadius: 28,
      overflow: 'hidden',
      elevation: 4,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
    },
    subscribeGradient: {
      height: 52,
      justifyContent: 'center',
      alignItems: 'center',
    },
    subscribeButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    supportFooter: {
      marginTop: 18,
      marginBottom: 12,
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    supportFooterText: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    supportFooterLink: {
      color: colors.primaryLight || colors.primary,
      textDecorationLine: 'underline',
    },
  });

export default SubscriptionModal;
