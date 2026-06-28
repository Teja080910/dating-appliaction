import React, {
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  useRef,
} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
  ScrollView,
  Keyboard,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppContext from '../../context/CreateGlobalStateContext';
import AttractiveLogo from '../../components/AttractiveLogo';
import {useAuth} from '../../api/useAuth';
import {useAlert} from '../../components/AlertModal';
import {extractSession, resolveInitialRoute} from '../../utils/session';
import {
  buildLoginPayload,
  normalizeMobileNumber,
} from '../../utils/authPayload';
import {Colors, Spacing, Shadows} from '../../theme';

const SMALL_SCREEN_HEIGHT = 700;
const COMPACT_HEIGHT = 640;

const LoginScreen = ({navigation}: any) => {
  const {alert, AlertComponent} = useAlert();
  const {password, setPassword, phoneNumber, setPhoneNumber} =
    useContext(AppContext);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const {login} = useAuth();
  const {height: screenHeight} = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const subscription = Keyboard.addListener(showEvent, () => {
      // Wait for layout/viewport adjustment to complete before scrolling
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({animated: true});
      }, 100);
    });
    return () => {
      subscription.remove();
    };
  }, []);

  const isSmall = screenHeight < SMALL_SCREEN_HEIGHT;
  const isCompact = screenHeight < COMPACT_HEIGHT;

  const logoSize = isCompact ? 32 : isSmall ? 40 : 48;
  const topSectionMb = isCompact
    ? Spacing.sm
    : isSmall
    ? Spacing.md
    : Spacing.lg;

  const dynamicStyles = useMemo(() => {
    const glowSize = logoSize + 16;
    const brandingFont = isCompact ? 20 : isSmall ? 24 : 28;
    const cardPaddingV = isCompact
      ? Spacing.md
      : isSmall
      ? Spacing.md
      : Spacing.lg;
    const cardPaddingH = isCompact ? Spacing.lg : Spacing.xl;
    const inputHeight = isCompact ? 48 : 54;
    const btnHeight = isCompact ? 48 : 54;
    const cardTitleSize = isCompact ? 17 : isSmall ? 18 : 20;
    const subtitleSize = isCompact ? 11 : 12;
    const inputFontSize = isCompact ? 14 : 16;
    const btnFontSize = isCompact ? 13 : 16;
    const registerFontSize = isCompact ? 12 : 14;
    const dividerMargin = isCompact ? Spacing.md : Spacing.lg;

    return StyleSheet.create({
      logoGlow: {
        width: glowSize,
        height: glowSize,
        borderRadius: glowSize / 2,
        backgroundColor: Colors.glow,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.xs,
      },
      branding: {
        fontSize: brandingFont,
        fontWeight: '900',
        color: Colors.text,
        marginTop: Spacing.xs,
        letterSpacing: 5,
      },
      slogan: {
        color: Colors.textSecondary,
        fontSize: isCompact ? 10 : 12,
        marginTop: Spacing.xs,
        fontWeight: '500',
        letterSpacing: 0.4,
      },
      card: {
        backgroundColor: Colors.surface,
        borderRadius: Spacing.radiusXxl,
        paddingHorizontal: cardPaddingH,
        paddingVertical: cardPaddingV,
        width: '100%',
        alignSelf: 'center',
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        ...Shadows.xl,
      },
      cardTitle: {
        fontSize: cardTitleSize,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: Spacing.xs,
        lineHeight: cardTitleSize + 6,
      },
      cardSubtitle: {
        fontSize: subtitleSize,
        color: Colors.textSecondary,
        marginBottom: isCompact ? Spacing.sm : Spacing.md,
        lineHeight: subtitleSize + 6,
      },
      inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.inputBackground,
        borderRadius: Spacing.radiusMd,
        marginBottom: isCompact ? Spacing.sm : Spacing.md,
        paddingHorizontal: Spacing.lg,
        height: inputHeight,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
      },
      input: {
        flex: 1,
        marginLeft: Spacing.md,
        color: Colors.text,
        fontSize: inputFontSize,
        fontWeight: '500',
      },
      loginBtn: {
        borderRadius: Spacing.radiusMd,
        height: btnHeight,
        overflow: 'hidden',
        ...Shadows.md,
      },
      loginBtnText: {
        color: Colors.white,
        fontWeight: '900',
        fontSize: btnFontSize,
        letterSpacing: 1,
      },
      divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: dividerMargin,
      },
      registerBtn: {
        height: btnHeight,
        borderRadius: Spacing.radiusMd,
        borderWidth: 1.5,
        borderColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(124, 58, 237, 0.06)',
      },
      registerBtnText: {
        color: Colors.primary,
        fontWeight: '900',
        fontSize: registerFontSize,
        letterSpacing: 1,
      },
    });
  }, [isCompact, isSmall, logoSize]);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.setItem('onboardingStep', 'Login');
    }, []),
  );

  const handleLogin = async () => {
    const normalizedMobile = normalizeMobileNumber(phoneNumber);
    if (!normalizedMobile || !password.trim()) {
      alert('Missing Info', 'Please enter mobile number and password.');
      return;
    }
    if (normalizedMobile.length < 10) {
      alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    const payload = buildLoginPayload(normalizedMobile, password);

    login.mutate(payload, {
      onSuccess: async (data: any) => {
        if (data?.success === false) {
          setLoading(false);
          alert(
            'Login Failed',
            data?.message || 'Invalid mobile number or password.',
          );
          return;
        }
        const session = extractSession(data);
        if (!session.token) {
          setLoading(false);
          alert(
            'Login Error',
            data?.message || 'Server did not return a valid session.',
          );
          return;
        }
        setLoading(false);
        const nextRoute = await resolveInitialRoute();
        navigation.replace(nextRoute);
      },
      onError: (error: any) => {
        setLoading(false);
        const status = error.response?.status;
        const serverMessage = error.response?.data?.message;
        if (serverMessage) alert('Login Failed', String(serverMessage));
        else if (status === 401 || status === 403)
          alert('Login Failed', 'Invalid mobile number or password.');
        else if (status === 404)
          alert(
            'Account Not Found',
            'No account found. Please register first.',
          );
        else if (!error.response)
          alert('Connection Error', 'Unable to connect to server.');
        else alert('Login Failed', error.message);
      },
    });
  };

  const renderForm = () => (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      <View style={[styles.topSection, {marginBottom: topSectionMb}]}>
        <View style={dynamicStyles.logoGlow}>
          <AttractiveLogo size={logoSize} />
        </View>
        <Text style={dynamicStyles.branding}>AMARA</Text>
        <Text style={dynamicStyles.slogan}>
          Private chemistry, beautifully designed.
        </Text>
      </View>

      <View style={dynamicStyles.card}>
        <Text style={styles.eyebrow}>WELCOME BACK</Text>
        <Text style={dynamicStyles.cardTitle}>
          Sign in to your private circle
        </Text>
        <Text style={dynamicStyles.cardSubtitle}>
          Verified members, elegant profiles, and a more intentional dating
          experience.
        </Text>

        <View style={styles.inputGroup}>
          <View style={dynamicStyles.inputBox}>
            <Icon name="phone-outline" size={20} color={Colors.primary} />
            <TextInput
              placeholder="Mobile Number"
              style={dynamicStyles.input}
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
          </View>

          <View style={dynamicStyles.inputBox}>
            <Icon name="lock-outline" size={20} color={Colors.primary} />
            <TextInput
              placeholder="Your Password"
              style={dynamicStyles.input}
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeToggle}>
              <Icon
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={Colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[dynamicStyles.loginBtn, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}>
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.loginGradient}>
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={dynamicStyles.loginBtnText}>LOGIN</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={dynamicStyles.divider}>
          <View style={styles.line} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.line} />
        </View>

        <TouchableOpacity
          style={dynamicStyles.registerBtn}
          onPress={() => navigation.navigate('Register')}>
          <Text style={dynamicStyles.registerBtnText}>CREATE ACCOUNT</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <LinearGradient
        colors={[Colors.background, '#1A1530', Colors.surface]}
        style={styles.gradient}>
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            style={styles.keyboard}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            {renderForm()}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
      {AlertComponent}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  gradient: {flex: 1},
  safeArea: {flex: 1},
  keyboard: {flex: 1},
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingVertical: Spacing.lg,
  },
  topSection: {alignItems: 'center'},
  eyebrow: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: Spacing.xs,
  },
  inputGroup: {marginBottom: Spacing.md},
  eyeToggle: {padding: Spacing.sm},
  loginGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {opacity: 0.7},
  line: {flex: 1, height: 1, backgroundColor: Colors.divider},
  orText: {
    marginHorizontal: Spacing.lg,
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
  },
});

export default LoginScreen;
