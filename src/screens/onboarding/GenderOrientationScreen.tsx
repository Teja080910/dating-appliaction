import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useContext, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  BackHandler,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppContext from '../../context/CreateGlobalStateContext';
import { saveGender } from '../../utils/types/AsyncStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Shadows } from '../../theme';
import { useProfile } from '../../api/useProfile';
import { getUserId } from '../../utils/sessionHelper';
import { useAlert } from '../../components/AlertModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GenderOrientationScreen = ({ navigation }: any) => {
  const { setSelected } = useContext(AppContext);
  const [selection, setSelection] = useState<string | null>(null);
  const { genderOrientation } = useProfile();
  const { alert, AlertComponent } = useAlert();

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.setItem('onboardingStep', 'GenderOrientation');
      const onBackPress = () => {
        navigation.replace('Privacy');
        return true;
      }
      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backHandler.remove();
    }, [navigation]),
  )

  const handleNext = async () => {
    if (selection) {
      try {
        console.log('Final Selection:', selection);
        setSelected(selection);
        await saveGender(selection);
        const resolvedUserId = await getUserId();

        const genderPayload =
          selection === 'straight_woman'
            ? { userId: resolvedUserId, gender: 'woman', orientation: 'straight' }
            : selection === 'straight_man'
              ? { userId: resolvedUserId, gender: 'man', orientation: 'straight' }
              : { userId: resolvedUserId, gender: 'lgbtqia', orientation: 'lgbtqia' };

        await genderOrientation.mutateAsync(genderPayload);

        await AsyncStorage.setItem('GenderOrientation', 'true');
        
        console.log('Navigating to DisplayName...');
        navigation.navigate('DisplayName');
      } catch (error) {
        console.error('Navigation Error:', error);
        const apiMessage =
          (error as any)?.response?.data?.message ||
          (error as any)?.response?.data?.error ||
          (typeof (error as any)?.response?.data === 'string' ? (error as any).response.data : null) ||
          (error as any)?.message ||
          'Failed to save selection. Please try again.';
        alert("Error", String(apiMessage));
      }
    } else {
      alert("Selection Required", "Please select your gender and orientation to continue.");
    }
  };

  const renderCard = (label: string, value: string, icon: string) => {
    const isSelected = selection === value;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.card, isSelected && styles.selectedCard]}
        onPress={() => {
            console.log('Selected:', value);
            setSelection(value);
        }}
      >
        <Icon name={icon} size={42} color={isSelected ? Colors.primary : Colors.textMuted} />
        <Text style={[styles.cardLabel, isSelected && styles.selectedCardLabel]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={[Colors.background, Colors.surface]} style={styles.gradient}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.progressContainer}>
            <View style={styles.progressFill} />
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>What's your gender and orientation?</Text>
            
            <View style={styles.cardsRow}>
              {renderCard("I'm a straight woman", "straight_woman", "gender-female")}
              {renderCard("I'm a straight man", "straight_man", "gender-male")}
              {renderCard("I'm LGBTQIA+", "lgbtqia", "equal")}
            </View>
          </View>

          <View style={styles.footer}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconCircle}>
                <Text style={styles.infoIconText}>i</Text>
              </View>
              <Text style={styles.infoText}>
                Men have total privacy at AMARA. Only people you invite can see your profile.
              </Text>
            </View>

            <TouchableOpacity
              disabled={!selection}
              style={[styles.nextButton, !selection && { opacity: 0.5 }]}
              onPress={handleNext}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.nextGradient}
              >
                <Text style={styles.nextText}>NEXT</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        {AlertComponent}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  progressContainer: {
    height: 4,
    backgroundColor: Colors.surfaceLighter,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.sm + 2,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    width: '40%',
    height: '100%',
    backgroundColor: Colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl + 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  card: {
    flex: 1,
    height: SCREEN_WIDTH * 0.45,
    borderRadius: Spacing.radiusXl,
    borderWidth: 1.5,
    borderColor: Colors.glassBorder,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm + 2,
    ...Shadows.md,
  },
  selectedCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: Colors.glass,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 18,
  },
  selectedCardLabel: {
    color: Colors.text,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl + 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl + 16,
    paddingHorizontal: Spacing.sm,
  },
  infoIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.glass,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  infoIconText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  infoText: {
    flex: 1,
    fontSize: 12.5,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  nextButton: {
    borderRadius: Spacing.radiusFull,
    overflow: 'hidden',
    ...Shadows.md,
  },
  nextGradient: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
});

export default GenderOrientationScreen;
