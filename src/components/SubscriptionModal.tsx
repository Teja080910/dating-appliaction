import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppContext from '../context/CreateGlobalStateContext';
import { useSubscription } from '../api/useSubscription';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import RazorpayCheckout from 'react-native-razorpay';
import { Image } from 'react-native';
import { useAlert } from './AlertModal';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
}

type SupportedPaymentMode = 'upi' | 'card' | 'netbanking' | 'wallet';
type RazorpayCheckoutOptions = Parameters<typeof RazorpayCheckout.open>[0];
type RazorpayCheckoutResponse = Awaited<ReturnType<typeof RazorpayCheckout.open>>;

const PLANS = [
  {
    id: 'BASIC',
    name: 'Standard',
    price: '₹499',
    duration: '1 Month',
    features: ['Unlimited Swipes', '5 Super Hearts', '1 Profile Boost'],
    color: ['#A0A0A0', '#4A4A4A'],
    icon: 'star-outline',
  },
  {
    id: 'GOLD',
    name: 'Premium',
    price: '₹1,299',
    duration: '3 Months',
    features: ['All Standard Features', 'See Who Likes You', 'Passport to Any Location', 'No Ads'],
    color: ['#FF5A79', '#7928CA'],
    icon: 'crown',
    recommended: true,
  },
  {
    id: 'PREMIUM',
    name: 'Elite',
    price: '₹2,499',
    duration: '6 Months',
    features: ['All Premium Features', 'Priority Messaging', 'Exclusive Elite Badge', 'Profile Review'],
    color: ['#FFD700', '#B8860B'],
    icon: 'diamond-stone',
  },
];

const PAYMENT_METHODS: Array<{
  id: SupportedPaymentMode;
  label: string;
  subtitle: string;
  icon: string;
}> = [
  {
    id: 'upi',
    label: 'UPI',
    subtitle: 'Google Pay, PhonePe',
    icon: 'qrcode-scan',
  },
  {
    id: 'card',
    label: 'Card',
    subtitle: 'Visa, MasterCard, RuPay',
    icon: 'credit-card-outline',
  },
  {
    id: 'netbanking',
    label: 'Net Banking',
    subtitle: 'All Indian banks',
    icon: 'bank-outline',
  },
  {
    id: 'wallet',
    label: 'Wallet',
    subtitle: 'Paytm, Mobikwik',
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
      resolveCheckoutAmount(dataPayload?.amount) ||
      resolveCheckoutAmount(dataPayload?.amount_due) ||
      resolveCheckoutAmount(orderPayload?.amount),
    currency:
      normalizeTextValue(orderData?.currency) ||
      normalizeTextValue(dataPayload?.currency) ||
      normalizeTextValue(orderPayload?.currency) ||
      'INR',
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
  const { alert, AlertComponent } = useAlert();
  const { setIsSubscribed, displayName, name, email, phoneNumber } =
    useContext(AppContext);
  const { createOrder, verifyPayment, activateSubscription } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('GOLD');
  const [selectedPaymentMode, setSelectedPaymentMode] =
    useState<SupportedPaymentMode | 'all'>('all');

  useEffect(() => {
    if (!visible) {
      return;
    }

    setLoading(false);
    setSelectedPlanId('GOLD');
    setSelectedPaymentMode('upi');
  }, [visible]);

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

      const prefillName = normalizeTextValue(normalizedOrder.prefill.name || displayName || name || 'AMARA User') || 'AMARA User';
      const prefillEmail = normalizeTextValue(normalizedOrder.prefill.email || email) || undefined;
      const prefillContact = normalizeDigitsOnly(normalizedOrder.prefill.contact || phoneNumber) || undefined;

      const options: RazorpayCheckoutOptions = {
        key: normalizedOrder.key,
        amount: normalizedOrder.amount,
        currency: normalizedOrder.currency,
        name: normalizedOrder.name,
        description: normalizedOrder.description || `AMARA ${selectedPlanId} Plan`,
        image: normalizedOrder.image || 'https://cdn-icons-png.flaticon.com/512/2111/2111646.png',
        order_id: normalizedOrder.orderId || (normalizedOrder as any).razorpayOrderId || (normalizedOrder as any).id,
        prefill: {
          name: prefillName,
          ...(prefillEmail ? { email: prefillEmail } : {}),
          ...(prefillContact ? { contact: prefillContact } : {}),
          ...(selectedPaymentMode !== 'all' ? { method: selectedPaymentMode } : {}),
        },
        theme: {
          color: normalizedOrder.theme.color || '#FF5A79',
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

      // STEP 4: Activate on Success (Backend Data Saving)
      // Call both verification and activation as per backend requirements
      await Promise.all([
        verifyPayment.mutateAsync({
          orderId: paymentData.razorpay_order_id,
          paymentId: paymentData.razorpay_payment_id,
          signature: paymentData.razorpay_signature,
        }),
        activateSubscription.mutateAsync({
          plan: selectedPlanId,
        }),
      ]);

      setIsSubscribed(true);
      await AsyncStorage.setItem('isSubscribed', 'true');
      Toast.show({ type: 'success', text1: 'Payment Successful 💎', text2: 'Welcome to AMARA PREMIUM' });
      onClose();

    } catch (error: any) {
      console.warn('Payment Error:', error?.message || error);
      const backendMessage = error?.response?.data?.message || error?.description || error?.message || 'Something went wrong.';

      if (error?.code === 0 || error?.code === 2 || /cancelled/i.test(backendMessage) || /failed.*checkout/i.test(backendMessage)) {
        alert('Cancelled', 'Payment cancelled');
        return;
      }

      if (backendMessage === 'User not found' || error?.response?.status === 404 || error?.response?.status === 401) {
        alert(
          'Sync Needed',
          "We're having trouble confirming your account server-side. Please retry once your login session is active on the backend.",
          [
            { text: 'Cancel', onPress: () => setLoading(false) },
            { text: 'Retry Anyway', onPress: () => handleUpgradePress() }
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
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" size={24} color="#FFF" />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Icon name="diamond-stone" size={50} color="#FFD700" />
              <Text style={styles.title}>AMARA PREMIUM</Text>
              <Text style={styles.subtitle}>
                Unlock exclusive features and find your perfect match faster.
              </Text>
            </View>

            <View style={styles.plansContainer}>
              {PLANS.map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.planCard,
                    selectedPlanId === plan.id && styles.selectedPlanCard,
                  ]}
                  onPress={() => setSelectedPlanId(plan.id)}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={plan.color}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.planGradient}
                  >
                    {plan.recommended && (
                      <View style={styles.recommendedBadge}>
                        <Text style={styles.recommendedText}>MOST POPULAR</Text>
                      </View>
                    )}
                    <View style={styles.planHeader}>
                      <Icon name={plan.icon} size={28} color="#FFF" />
                      <View>
                        <Text style={styles.planName}>{plan.name}</Text>
                        <Text style={styles.planDuration}>{plan.duration}</Text>
                      </View>
                      <Text style={styles.planPrice}>{plan.price}</Text>
                    </View>
                  </LinearGradient>

                  {selectedPlanId === plan.id && (
                    <View style={styles.featuresContainer}>
                      {plan.features.map((feature, idx) => (
                        <View key={idx} style={styles.featureRow}>
                          <Icon
                            name="check-circle"
                            size={18}
                            color="#FF5A79"
                          />
                          <Text style={styles.featureText}>{feature}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.paymentSection}>
              <Text style={styles.sectionLabel}>PAYMENT POWERED BY</Text>
              <View style={styles.razorpayBrandContainer}>
                <Image 
                  source={{ uri: 'https://cdn.iconscout.com/icon/free/png-256/free-razorpay-logo-icon-download-in-svg-png-gif-file-formats--payment-gateway-brand-logos-pack-icons-3522017.png' }} 
                  style={styles.razorpayLogo}
                  resizeMode="contain"
                />
                <Text style={styles.razorpayText}>Razorpay</Text>
              </View>
              <Text style={styles.trustText}>100% Secure • PCI-DSS Compliant • SSL Encrypted</Text>
            </View>

            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={handleUpgradePress}
              disabled={loading}
            >
              <LinearGradient
                colors={['#2196F3', '#1976D2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.upgradeGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <View style={styles.payButtonContent}>
                    <Icon name="shield-check" size={24} color="#FFF" />
                    <Text style={styles.upgradeText}>PAY SECURELY</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.footerText}>
              You will be redirected to Razorpay checkout
            </Text>
          </ScrollView>
        </View>
      </View>
      {AlertComponent}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: SCREEN_HEIGHT * 0.85,
    padding: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 10,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 2,
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#AAA',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  plansContainer: {
    gap: 15,
    marginBottom: 28,
  },
  planCard: {
    borderRadius: 20,
    backgroundColor: '#1E1E1E',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPlanCard: {
    borderColor: '#FF5A79',
  },
  planGradient: {
    padding: 20,
  },
  recommendedBadge: {
    position: 'absolute',
    top: 0,
    right: 20,
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FF5A79',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  planDuration: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  planPrice: {
    marginLeft: 'auto',
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
  },
  featuresContainer: {
    padding: 20,
    gap: 10,
  },
  paymentSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#AAA',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  razorpayBrandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 8,
  },
  razorpayLogo: {
    width: 24,
    height: 24,
  },
  razorpayText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  trustText: {
    color: '#666',
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  payButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    color: '#DDD',
    fontSize: 14,
  },
  upgradeButton: {
    marginBottom: 15,
  },
  upgradeGradient: {
    height: 55,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF5A79',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  upgradeText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  footerText: {
    color: '#444',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10,
    letterSpacing: 0.5,
  },
});

export default SubscriptionModal;
