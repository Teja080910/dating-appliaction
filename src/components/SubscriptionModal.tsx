import React, { useContext, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  Image, 
  Dimensions, 
  ScrollView,
  SafeAreaView
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppContext from '../context/CreateGlobalStateContext';
import RazorpayMock from './RazorpayMock';
import Toast from 'react-native-toast-message';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
}

const SubscriptionModal = ({ visible, onClose }: SubscriptionModalProps) => {
  const { setIsSubscribed } = useContext(AppContext);
  const [razorpayVisible, setRazorpayVisible] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState('₹1,999');

  const handleUpgradePress = () => {
    // Show Razorpay Mock
    setRazorpayVisible(true);
  };

  const onPaymentSuccess = () => {
      setRazorpayVisible(false);
      setIsSubscribed(true); // Turn on PREMIUM
      onClose(); // Close Paywall
      
      Toast.show({
          type: 'success',
          text1: 'Premium Activated!',
          text2: 'You now have unlimited access to all features.',
          position: 'bottom'
      });
  };

  return (
    <>
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={['#1A1A1A', '#000']}
          style={styles.modalContent}
        >
          {/* Draggable Indicator */}
          <View style={styles.indicator} />
          
          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Icon name="close-circle" size={32} color="#AAA" />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Header Section */}
            <View style={styles.header}>
                <LinearGradient
                    colors={['#FFD700', '#FFA500']}
                    style={styles.logoCircle}
                >
                    <Icon name="crown" size={38} color="#000" />
                </LinearGradient>
                <Text style={styles.mainTitle}>AMARA <Text style={styles.goldText}>PREMIUM</Text></Text>
                <Text style={styles.subtitle}>Unlock exclusive features and find your perfect match faster.</Text>
            </View>

            {/* Premium Benefits List */}
            <View style={styles.benefitsArea}>
                <BenefitRow icon="cards-heart" title="Unlimited Invitations" desc="No more limits. Send as many invites as you want." />
                <BenefitRow icon="message-text-fast" title="Priority Messaging" desc="Your messages appear at the top of their inbox." />
                <BenefitRow icon="eye-off" title="Incognito Browsing" desc="See profiles without them knowing you visited." />
                <BenefitRow icon="check-decagram" title="Verified Member Badge" desc="Get a blue badge and 3x more profile visibility." />
                <BenefitRow icon="undo-variant" title="Rewind Last Swipes" desc="Made a mistake? Just undo your last choice." />
            </View>

            {/* Plan Picker Container */}
            <View style={styles.plansSection}>
                <Text style={styles.sectionHeading}>CHOOSE A PLAN</Text>
                
                <View style={styles.plansGrid}>
                    <TierPlan 
                        title="1 MONTH" 
                        price="₹499" 
                        pricePerMonth="₹499/mo"
                        oldPrice="₹699" 
                        onPress={() => setSelectedAmount('₹499')}
                        isSelected={selectedAmount === '₹499'}
                    />
                    <TierPlan 
                        title="6 MONTHS" 
                        price="₹1,999" 
                        pricePerMonth="₹333/mo"
                        oldPrice="₹4,199" 
                        highlight="POPULAR"
                        active
                        onPress={() => setSelectedAmount('₹1,999')}
                        isSelected={selectedAmount === '₹1,999'}
                    />
                    <TierPlan 
                        title="12 MONTHS" 
                        price="₹3,499" 
                        pricePerMonth="₹291/mo"
                        oldPrice="₹8,390" 
                        highlight="SAVE 60%"
                        onPress={() => setSelectedAmount('₹3,499')}
                        isSelected={selectedAmount === '₹3,499'}
                    />
                </View>
            </View>

            {/* Main Action Button */}
            <TouchableOpacity activeOpacity={0.8} style={styles.upgradeBtn} onPress={handleUpgradePress}>
                <LinearGradient
                    colors={['#FF5A79', '#D94466']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.upgradeGradient}
                >
                    <Text style={styles.upgradeBtnText}>UPGRADE TO PREMIUM</Text>
                    <Icon name="arrow-right" size={20} color="#fff" />
                </LinearGradient>
            </TouchableOpacity>

            {/* Restore / Terms Link */}
            <View style={styles.footerLinks}>
                <TouchableOpacity><Text style={styles.footerLinkText}>Restore Purchases</Text></TouchableOpacity>
                <View style={styles.dot} />
                <TouchableOpacity><Text style={styles.footerLinkText}>Terms of Use</Text></TouchableOpacity>
                <View style={styles.dot} />
                <TouchableOpacity><Text style={styles.footerLinkText}>Privacy Policy</Text></TouchableOpacity>
            </View>

            <Text style={styles.disclaimer}>
                Subscriptions will automatically renew unless canceled at least 24 hours before the end of the current period.
            </Text>
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>

    <RazorpayMock 
        visible={razorpayVisible} 
        amount={selectedAmount} 
        onSuccess={onPaymentSuccess} 
        onCancel={() => setRazorpayVisible(false)} 
    />
    </>
  );
};

const BenefitRow = ({ icon, title, desc }: { icon: string, title: string, desc: string }) => (
    <View style={styles.benefitRow}>
        <View style={styles.checkInner}>
            <Icon name={icon} size={22} color="#FF5A79" />
        </View>
        <View style={styles.benefitText}>
            <Text style={styles.benefitTitle}>{title}</Text>
            <Text style={styles.benefitDesc}>{desc}</Text>
        </View>
    </View>
);

const TierPlan = ({ title, price, pricePerMonth, oldPrice, highlight, isSelected, onPress }: any) => (
    <TouchableOpacity style={[styles.planBox, isSelected && styles.activePlanBox]} onPress={onPress}>
        {highlight && (
            <View style={styles.highlightBadge}>
                <Text style={styles.highlightText}>{highlight}</Text>
            </View>
        )}
        <Text style={[styles.planName, isSelected && styles.activeText]}>{title}</Text>
        <Text style={[styles.planPriceMain, isSelected && styles.activeText]}>{price}</Text>
        <Text style={styles.planPerMo}>{pricePerMonth}</Text>
        <Text style={styles.strokePrice}>{oldPrice}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    width: '100%',
    height: '94%',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingTop: 15,
  },
  indicator: {
      width: 40,
      height: 5,
      backgroundColor: '#333',
      borderRadius: 10,
      alignSelf: 'center',
      marginBottom: 5,
  },
  closeBtn: {
    position: 'absolute',
    top: 25,
    right: 25,
    zIndex: 100,
  },
  scrollContent: {
      paddingHorizontal: 25,
      paddingTop: 20,
      paddingBottom: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
      width: 76,
      height: 76,
      borderRadius: 38,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
      elevation: 15,
      shadowColor: '#FFD700',
      shadowOpacity: 0.5,
      shadowRadius: 10,
  },
  mainTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
  },
  goldText: {
      color: '#FFD700',
  },
  subtitle: {
    fontSize: 15,
    color: '#AAA',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 30,
    lineHeight: 22,
  },
  benefitsArea: {
      width: '100%',
      marginBottom: 40,
      backgroundColor: '#222',
      borderRadius: 20,
      padding: 20,
      gap: 20,
  },
  benefitRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 15,
  },
  checkInner: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: '#333',
      justifyContent: 'center',
      alignItems: 'center',
  },
  benefitText: {
      flex: 1,
  },
  benefitTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: '#fff',
  },
  benefitDesc: {
      fontSize: 13,
      color: '#999',
      marginTop: 2,
      lineHeight: 18,
  },
  plansSection: {
      marginBottom: 35,
  },
  sectionHeading: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#666',
      letterSpacing: 1.5,
      textAlign: 'center',
      marginBottom: 20,
  },
  plansGrid: {
      flexDirection: 'row',
      gap: 10,
      justifyContent: 'space-between',
  },
  planBox: {
      flex: 1,
      backgroundColor: '#1E1E1E',
      borderRadius: 18,
      paddingVertical: 20,
      paddingHorizontal: 10,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#333',
      position: 'relative',
  },
  activePlanBox: {
      borderColor: '#FF5A79',
      backgroundColor: '#2A2A2A',
  },
  highlightBadge: {
      position: 'absolute',
      top: -12,
      backgroundColor: '#FF5A79',
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 10,
  },
  highlightText: {
      fontSize: 10,
      fontWeight: '900',
      color: '#fff',
  },
  planName: {
      fontSize: 11,
      fontWeight: '900',
      color: '#888',
      marginBottom: 10,
  },
  planPriceMain: {
      fontSize: 22,
      fontWeight: '900',
      color: '#fff',
  },
  planPerMo: {
      fontSize: 12,
      color: '#AAA',
      marginTop: 4,
      fontWeight: '600',
  },
  strokePrice: {
      fontSize: 11,
      color: '#555',
      textDecorationLine: 'line-through',
      marginTop: 8,
  },
  activeText: {
      color: '#fff',
  },
  upgradeBtn: {
      width: '100%',
      height: 64,
      borderRadius: 18,
      overflow: 'hidden',
      marginBottom: 25,
      elevation: 8,
      shadowColor: '#FF5A79',
  },
  upgradeGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      gap: 12,
  },
  upgradeBtnText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '900',
      letterSpacing: 1,
  },
  footerLinks: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 10,
      marginBottom: 15,
  },
  footerLinkText: {
      color: '#888',
      fontSize: 12,
      fontWeight: '600',
  },
  dot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#444',
  },
  disclaimer: {
    color: '#444',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
  }
});

export default SubscriptionModal;
