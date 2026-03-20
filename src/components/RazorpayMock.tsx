import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ActivityIndicator, 
  Image,
  Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RazorpayMockProps {
  visible: boolean;
  amount: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const RazorpayMock = ({ visible, amount, onSuccess, onCancel }: RazorpayMockProps) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'selection' | 'processing' | 'success'>('selection');

  const handlePay = () => {
    setLoading(true);
    setStep('processing');
    
    // Simulate Razorpay processing
    setTimeout(() => {
        setLoading(false);
        setStep('success');
        
        // Finalize
        setTimeout(() => {
            onSuccess();
        }, 1500);
    }, 2000);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
            {/* Razorpay Header */}
            <View style={styles.header}>
                <Image 
                    source={{ uri: 'https://razorpay.com/favicon.png' }} 
                    style={styles.logo} 
                />
                <View>
                    <Text style={styles.brand}>Razorpay</Text>
                    <Text style={styles.amount}>Pay {amount}</Text>
                </View>
                <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
                     <Icon name="close" size={24} color="#666" />
                </TouchableOpacity>
            </View>

            {step === 'selection' && (
                <View style={styles.body}>
                    <Text style={styles.label}>Select Payment Method</Text>
                    <PaymentOption icon="credit-card" title="Cards" sub="Visa, MasterCard, RuPay" />
                    <PaymentOption icon="bank" title="Net Banking" sub="All Indian Banks" />
                    <PaymentOption icon="google-play" title="UPI" sub="Google Pay, PhonePe, Paytm" active />
                    <PaymentOption icon="wallet" title="Wallet" sub="Mobikwik, Freecharge" />

                    <TouchableOpacity style={styles.payBtn} onPress={handlePay}>
                        <Text style={styles.payBtnText}>PAY NOW</Text>
                    </TouchableOpacity>
                </View>
            )}

            {step === 'processing' && (
                <View style={styles.loadingBody}>
                    <ActivityIndicator size="large" color="#3399FF" />
                    <Text style={styles.loadingText}>Processing your payment...</Text>
                    <Text style={styles.subLoadingText}>Do not press back or refresh</Text>
                </View>
            )}

            {step === 'success' && (
                <View style={styles.successBody}>
                    <View style={styles.successCircle}>
                        <Icon name="check-bold" size={40} color="#fff" />
                    </View>
                    <Text style={styles.successText}>Payment Successful!</Text>
                    <Text style={styles.subSuccess}>Welcome to AMARA Premium.</Text>
                </View>
            )}

            <View style={styles.footer}>
                 <Icon name="shield-check" size={16} color="#2ECC71" />
                 <Text style={styles.footerText}>Secure payment by Razorpay</Text>
            </View>
        </View>
      </View>
    </Modal>
  );
};

const PaymentOption = ({ icon, title, sub, active }: any) => (
    <TouchableOpacity style={[styles.option, active && styles.activeOption]}>
        <View style={styles.optionIcon}>
            <Icon name={icon} size={24} color={active ? '#3399FF' : '#666'} />
        </View>
        <View style={{ flex: 1 }}>
            <Text style={[styles.optionTitle, active && styles.activeText]}>{title}</Text>
            <Text style={styles.optionSub}>{sub}</Text>
        </View>
        <View style={[styles.radio, active && styles.radioActive]}>
             {active && <View style={styles.radioInner} />}
        </View>
    </TouchableOpacity>
);

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
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: 15,
    borderRadius: 6,
  },
  brand: {
    fontSize: 14,
    color: '#888',
    fontWeight: '700',
  },
  amount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
  },
  closeBtn: {
      marginLeft: 'auto',
  },
  body: {
    padding: 20,
  },
  label: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#AAA',
      marginBottom: 15,
      textTransform: 'uppercase',
  },
  option: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 15,
      borderWidth: 1,
      borderColor: '#F0F0F0',
      borderRadius: 10,
      marginBottom: 10,
  },
  activeOption: {
      borderColor: '#3399FF',
      backgroundColor: '#F5F9FF',
  },
  optionIcon: {
      width: 40,
  },
  optionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: '#444',
  },
  activeText: {
      color: '#3399FF',
  },
  optionSub: {
      fontSize: 11,
      color: '#999',
  },
  radio: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      borderColor: '#DDD',
      justifyContent: 'center',
      alignItems: 'center',
  },
  radioActive: {
      borderColor: '#3399FF',
  },
  radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#3399FF',
  },
  payBtn: {
      backgroundColor: '#3399FF',
      height: 52,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 20,
  },
  payBtnText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '900',
  },
  loadingBody: {
      padding: 50,
      alignItems: 'center',
  },
  loadingText: {
      marginTop: 20,
      fontSize: 16,
      fontWeight: '700',
      color: '#333',
  },
  subLoadingText: {
      fontSize: 12,
      color: '#AAA',
      marginTop: 5,
  },
  successBody: {
      padding: 50,
      alignItems: 'center',
  },
  successCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#2ECC71',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
  },
  successText: {
      fontSize: 20,
      fontWeight: '900',
      color: '#000',
  },
  subSuccess: {
      fontSize: 14,
      color: '#666',
      marginTop: 5,
  },
  footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 5,
      padding: 15,
      backgroundColor: '#F9FAFB',
      borderTopWidth: 1,
      borderTopColor: '#EEE',
  },
  footerText: {
      fontSize: 11,
      color: '#666',
      fontWeight: '600',
  }
});

export default RazorpayMock;
