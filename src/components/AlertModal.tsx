import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  BackHandler,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Spacing, useTheme } from '../theme';
import { getUserFriendlyMessage, getUserFriendlyTitle } from '../utils/userFriendlyMessages';
import { t } from '../i18n';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertModalProps {
  visible: boolean;
  title?: string;
  message: string;
  buttons?: AlertButton[];
  onDismiss?: () => void;
}

const getBadgeConfig = (title = '', message = '', buttons: AlertButton[] = []) => {
  const combined = `${title} ${message}`.toLowerCase();
  const hasDestructive = buttons.some((b) => b.style === 'destructive');

  if (
    combined.includes('saved') ||
    combined.includes('success') ||
    combined.includes('connected') ||
    combined.includes('approved') ||
    combined.includes('updated') ||
    combined.includes('unblocked') ||
    combined.includes('restored') ||
    combined.includes('ticket submitted')
  ) {
    return {
      icon: 'check-circle',
      iconColor: '#10B981',
      badgeBg: 'rgba(16, 185, 129, 0.16)',
      badgeBorder: 'rgba(16, 185, 129, 0.35)',
    };
  }

  if (
    hasDestructive ||
    combined.includes('error') ||
    combined.includes('failed') ||
    combined.includes('delete') ||
    combined.includes('remove') ||
    combined.includes('invalid') ||
    combined.includes('already registered') ||
    combined.includes('already in use')
  ) {
    return {
      icon: 'alert-circle',
      iconColor: '#EF4444',
      badgeBg: 'rgba(239, 68, 68, 0.16)',
      badgeBorder: 'rgba(239, 68, 68, 0.35)',
    };
  }

  if (buttons.length > 1 || combined.includes('?')) {
    return {
      icon: 'help-circle',
      iconColor: '#A78BFA',
      badgeBg: 'rgba(167, 139, 250, 0.16)',
      badgeBorder: 'rgba(167, 139, 250, 0.35)',
    };
  }

  return {
    icon: 'information',
    iconColor: '#A78BFA',
    badgeBg: 'rgba(167, 139, 250, 0.16)',
    badgeBorder: 'rgba(167, 139, 250, 0.35)',
  };
};

const AlertModal: React.FC<AlertModalProps> = ({
  visible,
  title,
  message,
  buttons,
  onDismiss,
}) => {
  const { themeColors, isDark } = useTheme();
  const styles = React.useMemo(() => createStyles(themeColors, isDark), [themeColors, isDark]);
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 18,
          stiffness: 240,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

  useEffect(() => {
    if (!visible) return;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onDismiss?.();
      return true;
    });
    return () => backHandler.remove();
  }, [visible, onDismiss]);

  const handlePress = (btn: AlertButton) => {
    onDismiss?.();
    btn.onPress?.();
  };

  const useActionList = Boolean(
    buttons &&
      (buttons.length > 2 ||
        buttons.some((b) => (b.text?.length || 0) > 16) ||
        (buttons.length === 2 && buttons.reduce((acc, b) => acc + (b.text?.length || 0), 0) > 24))
  );

  const sortedButtons = React.useMemo(() => {
    if (!buttons || buttons.length <= 1) return buttons || [];
    if (!useActionList) return buttons;
    const nonCancel = buttons.filter((b) => b.style !== 'cancel');
    const cancel = buttons.filter((b) => b.style === 'cancel');
    return [...nonCancel, ...cancel];
  }, [buttons, useActionList]);

  const badge = getBadgeConfig(title, message, buttons || []);

  const cardGradient = isDark
    ? (['#252048', '#16132D'] as [string, string])
    : (['#FFFFFF', '#F8FAFC'] as [string, string]);

  const primaryGradient = ['#9333EA', '#7C3AED'] as [string, string];
  const destructiveGradient = ['#EF4444', '#DC2626'] as [string, string];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View
          style={[
            styles.card,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <LinearGradient
            colors={cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[styles.gradient, useActionList && styles.gradientActionList]}
          >
            {/* Top-right close X */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onDismiss}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={t('more_info.moreinfoscreen.close')}
            >
              <Icon
                name="close"
                size={16}
                color={isDark ? 'rgba(255, 255, 255, 0.65)' : '#64748B'}
              />
            </TouchableOpacity>

            {/* Glowing Icon Badge */}
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: badge.badgeBg, borderColor: badge.badgeBorder },
              ]}
            >
              <Icon name={badge.icon} size={30} color={badge.iconColor} />
            </View>

            {/* Header Content */}
            <View style={useActionList ? styles.headerArea : styles.standardHeaderArea}>
              {Boolean(title) && <Text style={styles.title}>{title}</Text>}
              <Text
                style={[
                  styles.message,
                  !title && styles.messageNoTitle,
                  useActionList && styles.messageActionList,
                ]}
              >
                {message}
              </Text>
            </View>

            {/* Action Buttons */}
            {sortedButtons && sortedButtons.length > 0 && (
              useActionList ? (
                <View style={styles.actionList}>
                  {sortedButtons.map((btn, index) => {
                    const isCancel = btn.style === 'cancel';
                    const isDestructive = btn.style === 'destructive';

                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.actionItem,
                          index > 0 && styles.actionDivider,
                        ]}
                        onPress={() => handlePress(btn)}
                        activeOpacity={0.6}
                      >
                        <Text
                          style={[
                            styles.actionText,
                            isDestructive && styles.actionTextDestructive,
                            isCancel && styles.actionTextCancel,
                          ]}
                        >
                          {btn.text}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : sortedButtons.length === 1 ? (
                <TouchableOpacity
                  style={styles.singleButtonWrap}
                  onPress={() => handlePress(sortedButtons[0])}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={
                      sortedButtons[0].style === 'destructive'
                        ? destructiveGradient
                        : primaryGradient
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.singleButtonGradient}
                  >
                    <Text style={styles.singleButtonText}>{sortedButtons[0].text}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <View style={styles.buttonRow}>
                  {sortedButtons.map((btn, index) => {
                    const isCancel = btn.style === 'cancel';
                    const isDestructive = btn.style === 'destructive';

                    if (isCancel) {
                      return (
                        <TouchableOpacity
                          key={index}
                          style={[styles.button, styles.buttonCancel]}
                          onPress={() => handlePress(btn)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.buttonCancelText}>{btn.text}</Text>
                        </TouchableOpacity>
                      );
                    }

                    return (
                      <TouchableOpacity
                        key={index}
                        style={[styles.button, styles.gradientButtonWrapper]}
                        onPress={() => handlePress(btn)}
                        activeOpacity={0.85}
                      >
                        <LinearGradient
                          colors={isDestructive ? destructiveGradient : primaryGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.buttonGradient}
                        >
                          <Text style={styles.buttonText}>{btn.text}</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )
            )}
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export const useAlert = () => {
  const [alertState, setAlertState] = React.useState<{
    visible: boolean;
    title?: string;
    message: string;
    buttons?: AlertButton[];
  }>({ visible: false, message: '' });

  const alert = (
    titleOrMessage: string,
    messageOrButtons?: string | AlertButton[],
    maybeButtons?: AlertButton[]
  ) => {
    let title: string | undefined;
    let message: string;
    let buttons: AlertButton[] | undefined;

    if (typeof messageOrButtons === 'string') {
      title = titleOrMessage;
      message = messageOrButtons;
      buttons = maybeButtons;
    } else {
      title = undefined;
      message = titleOrMessage;
      buttons = messageOrButtons;
    }

    const titleLower = String(title || '').toLowerCase();
    const msgLower = String(message || '').toLowerCase();
    const combined = `${titleLower} ${msgLower}`;

    // Whitelist ONLY:
    // 1. Delete account / profile confirmation
    // 2. Photo removal / delete in profile
    // 3. Duplicate phone / number in use alert
    const isDeleteAccount =
      combined.includes('delete') && (combined.includes('account') || combined.includes('profile'));
    const isPhotoRemoval =
      combined.includes('photo') &&
      (combined.includes('remove') || combined.includes('delete') || combined.includes('options') || combined.includes('required'));
    const isDuplicatePhone =
      combined.includes('already in use') || combined.includes('already registered') || combined.includes('number already');
    const hasDestructiveBtn =
      Boolean(buttons && buttons.some((b) => b.style === 'destructive'));

    const isAllowed = isDeleteAccount || isPhotoRemoval || isDuplicatePhone || hasDestructiveBtn;

    if (!isAllowed) {
      // Automatically trigger primary button callback if present (e.g. navigation or confirm)
      const primaryBtn = buttons?.find((b) => b.style !== 'cancel');
      if (primaryBtn?.onPress) {
        try {
          primaryBtn.onPress();
        } catch {}
      }
      return;
    }

    setAlertState({
      visible: true,
      title: title ? getUserFriendlyTitle(title) : title,
      message: getUserFriendlyMessage(message),
      buttons,
    });
  };

  const dismiss = () => {
    setAlertState((prev) => ({ ...prev, visible: false }));
  };

  const AlertComponent = (
    <AlertModal
      visible={alertState.visible}
      title={alertState.title}
      message={alertState.message}
      buttons={alertState.buttons}
      onDismiss={dismiss}
    />
  );

  return { alert, dismiss, AlertComponent };
};

export default AlertModal;

const createStyles = (themeColors: any, isDark: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.72)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
    },
    card: {
      width: '100%',
      maxWidth: 340,
      maxHeight: '85%',
      borderRadius: 24,
      overflow: 'hidden',
      borderWidth: 1.2,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
      ...Platform.select({
        ios: {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.5,
          shadowRadius: 20,
        },
        android: {
          elevation: 16,
        },
      }),
    },
    gradient: {
      paddingTop: 30,
      paddingBottom: 24,
      paddingHorizontal: 22,
      alignItems: 'center',
    },
    gradientActionList: {
      paddingHorizontal: 0,
      paddingBottom: 0,
      paddingTop: 28,
    },
    closeButton: {
      position: 'absolute',
      top: 14,
      right: 14,
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
      zIndex: 10,
    },
    iconBadge: {
      width: 58,
      height: 58,
      borderRadius: 29,
      borderWidth: 1.5,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 14,
    },
    standardHeaderArea: {
      alignItems: 'center',
      width: '100%',
      paddingHorizontal: 6,
    },
    headerArea: {
      alignItems: 'center',
      width: '100%',
      paddingHorizontal: Spacing.xl,
    },
    title: {
      fontSize: 20,
      fontWeight: '800',
      color: isDark ? '#FFFFFF' : '#0F172A',
      marginBottom: 8,
      textAlign: 'center',
      letterSpacing: 0.2,
    },
    message: {
      fontSize: 14.5,
      color: isDark ? 'rgba(255, 255, 255, 0.78)' : '#475569',
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 24,
    },
    messageNoTitle: {
      marginTop: 4,
    },
    messageActionList: {
      marginBottom: Spacing.md,
    },
    actionList: {
      width: '100%',
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    },
    actionItem: {
      width: '100%',
      height: 52,
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionDivider: {
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    },
    actionText: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#0F172A',
    },
    actionTextDestructive: {
      color: '#EF4444',
      fontWeight: '600',
    },
    actionTextCancel: {
      color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748B',
      fontWeight: '500',
    },
    buttonRow: {
      flexDirection: 'row',
      width: '100%',
      gap: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    singleButtonWrap: {
      alignSelf: 'center',
      minWidth: 160,
      ...Platform.select({
        ios: {
          shadowColor: '#8B5CF6',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 10,
        },
        android: {
          elevation: 6,
        },
      }),
    },
    singleButtonGradient: {
      height: 48,
      borderRadius: 24,
      paddingHorizontal: 36,
      justifyContent: 'center',
      alignItems: 'center',
    },
    singleButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 0.25,
    },
    button: {
      flex: 1,
      height: 46,
      borderRadius: 23,
      justifyContent: 'center',
      alignItems: 'center',
    },
    gradientButtonWrapper: {
      ...Platform.select({
        ios: {
          shadowColor: '#8B5CF6',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.35,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    buttonGradient: {
      width: '100%',
      height: '100%',
      borderRadius: 23,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonCancel: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : '#CBD5E1',
    },
    buttonText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    buttonCancelText: {
      color: isDark ? 'rgba(255, 255, 255, 0.75)' : '#475569',
      fontWeight: '600',
      fontSize: 15,
    },
  });
