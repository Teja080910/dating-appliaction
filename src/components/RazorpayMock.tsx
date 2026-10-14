import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  BackHandler,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { t, useTranslation } from '../i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RazorpayMockProps {
  visible: boolean;
  amount: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const RazorpayMock = ({
  visible,
  amount,
  onSuccess,
  onCancel,
}: RazorpayMockProps) => {
  useTranslation();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'selection' | 'processing' | 'success'>('selection');
  const [selectedMethod, setSelectedMethod] = useState(t('common.razorpaymock.upi'));

  // ✅ Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setStep('selection');
      setLoading(false);
      setSelectedMethod(t('common.razorpaymock.upi'));
    }
  }, [visible]);

  // ✅ Prevent back press during payment
  useEffect(() => {
    const backAction = () => {
      if (step === 'processing') return true;
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [step]);

  const handlePay = () => {
    if (loading) return;

    setLoading(true);
    setStep('processing');

    setTimeout(() => {
      setLoading(false);
      setStep('success');

      setTimeout(() => {
        onSuccess();
      }, 1500);
    }, 2000);
  };

  const handleCancel = () => {
    if (step === 'processing') return; // ❌ block cancel during payment
    onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          
          {/* HEADER */}
          <View style={styles.header}>
            <Image
              source={{ uri: 'https://razorpay.com/favicon.png' }}
              style={styles.logo}
            />
            <View>
              <Text style={styles.brand}>{t('common.razorpaymock.razorpay')}</Text>
              <Text style={styles.amount}>Pay ₹{amount}</Text>
            </View>

            <TouchableOpacity onPress={handleCancel} style={styles.closeBtn}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* STEP: SELECT */}
          {step === 'selection' && (
            <View style={styles.body}>
              <Text style={styles.label}>{t('common.razorpaymock.select_payment_method')}</Text>

              <PaymentOption
                title={t('common.razorpaymock.cards')}
                sub={t('common.subscriptionmodal.visa_mastercard_rupay')}
                selected={selectedMethod}
                onSelect={setSelectedMethod}
              />
              <PaymentOption
                title={t('common.razorpaymock.net_banking')}
                sub="All Indian Banks"
                selected={selectedMethod}
                onSelect={setSelectedMethod}
              />
              <PaymentOption
                title={t('common.razorpaymock.upi')}
                sub={t('common.subscriptionmodal.google_pay_phonepe')}
                selected={selectedMethod}
                onSelect={setSelectedMethod}
              />
              <PaymentOption
                title={t('common.razorpaymock.wallet')}
                sub={t('common.subscriptionmodal.paytm_mobikwik')}
                selected={selectedMethod}
                onSelect={setSelectedMethod}
              />

              <TouchableOpacity style={styles.payBtn} onPress={handlePay}>
                <Text style={styles.payBtnText}>
                  PAY ₹{amount}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP: PROCESSING */}
          {step === 'processing' && (
            <View style={styles.loadingBody}>
              <ActivityIndicator size="large" color="#3399FF" />
              <Text style={styles.loadingText}>{t('common.razorpaymock.processing_payment')}</Text>
              <Text style={styles.subLoadingText}>{t('common.razorpaymock.please_do_not_go_back')}</Text>
            </View>
          )}

          {/* STEP: SUCCESS */}
          {step === 'success' && (
            <View style={styles.successBody}>
              <View style={styles.successCircle}>
                <Icon name="check-bold" size={40} color="#fff" />
              </View>
              <Text style={styles.successText}>{t('common.razorpaymock.payment_successful')}</Text>
              <Text style={styles.subSuccess}>{t('common.razorpaymock.premium_activated')}</Text>
            </View>
          )}

          {/* FOOTER */}
          <View style={styles.footer}>
            <Icon name="shield-check" size={16} color="#2ECC71" />
            <Text style={styles.footerText}>{t('common.razorpaymock.100_secure_by_razorpay')}</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ✅ Payment Option (Selectable)
const PaymentOption = ({ title, sub, selected, onSelect }: any) => {
  const active = selected === title;

  return (
    <TouchableOpacity
      style={[styles.option, active && styles.activeOption]}
      onPress={() => onSelect(title)}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.optionTitle, active && styles.activeText]}>
          {title}
        </Text>
        <Text style={styles.optionSub}>{sub}</Text>
      </View>

      <View style={[styles.radio, active && styles.radioActive]}>
        {active && <View style={styles.radioInner} />}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  container: {
    width: SCREEN_WIDTH * 0.9,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#F9FAFB',
  },

  logo: {
    width: 30,
    height: 30,
    marginRight: 10,
  },

  brand: {
    fontSize: 12,
    color: '#888',
  },

  amount: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  closeBtn: {
    marginLeft: 'auto',
  },

  body: {
    padding: 18,
  },

  label: {
    fontSize: 12,
    color: '#999',
    marginBottom: 10,
  },

  option: {
    padding: 14,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    marginBottom: 10,
  },

  activeOption: {
    borderColor: '#3399FF',
    backgroundColor: '#F4F8FF',
  },

  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },

  activeText: {
    color: '#3399FF',
  },

  optionSub: {
    fontSize: 11,
    color: '#888',
  },

  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#ccc',
    marginTop: 5,
  },

  radioActive: {
    borderColor: '#3399FF',
  },

  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3399FF',
    alignSelf: 'center',
    marginTop: 3,
  },

  payBtn: {
    backgroundColor: '#3399FF',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },

  payBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  loadingBody: {
    padding: 40,
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 15,
    fontSize: 16,
  },

  subLoadingText: {
    fontSize: 12,
    color: '#888',
  },

  successBody: {
    padding: 40,
    alignItems: 'center',
  },

  successCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#2ECC71',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  successText: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  subSuccess: {
    color: '#666',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 12,
    gap: 5,
  },

  footerText: {
    fontSize: 11,
  },
});

export default RazorpayMock;