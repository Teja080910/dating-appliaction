import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  BackHandler,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, Typography, Shadows, useTheme } from '../theme';
import { getUserFriendlyMessage, getUserFriendlyTitle } from '../utils/userFriendlyMessages';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertModalProps {
  visible: boolean;
  title?: string;
  message: string;
  buttons?: AlertButton[];
  onDismiss?: () => void;
}

const AlertModal = ({ visible, title, message, buttons, onDismiss }: AlertModalProps) => {
  const { themeColors, isDark } = useTheme();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 15,
          stiffness: 200,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
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
        buttons.some((b) => (b.text?.length || 0) > 14) ||
        (buttons.length === 2 && buttons.reduce((acc, b) => acc + (b.text?.length || 0), 0) > 22))
  );

  const sortedButtons = React.useMemo(() => {
    if (!buttons || buttons.length <= 1) return buttons || [];
    if (!useActionList) return buttons;
    const nonCancel = buttons.filter((b) => b.style !== 'cancel');
    const cancel = buttons.filter((b) => b.style === 'cancel');
    return [...nonCancel, ...cancel];
  }, [buttons, useActionList]);

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
            colors={[themeColors.surface, themeColors.surfaceLight]}
            style={[styles.gradient, useActionList && styles.gradientActionList]}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onDismiss}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Icon name="close" size={18} color={themeColors.textMuted} />
            </TouchableOpacity>

            <View style={useActionList ? styles.headerArea : styles.standardHeaderArea}>
              {title && <Text style={styles.title}>{title}</Text>}
              <Text style={[styles.message, !title && styles.messageNoTitle, useActionList && styles.messageActionList]}>
                {message}
              </Text>
            </View>

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
              ) : (
                <View
                  style={[
                    styles.buttonRow,
                    sortedButtons.length === 1 && styles.singleButtonRow,
                  ]}
                >
                  {sortedButtons.map((btn, index) => {
                    const isCancel = btn.style === 'cancel';
                    const isDestructive = btn.style === 'destructive';

                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.button,
                          sortedButtons.length === 1 && styles.singleButton,
                          isCancel && styles.buttonCancel,
                          isDestructive && styles.buttonDestructive,
                          !isCancel && !isDestructive && styles.buttonPrimary,
                        ]}
                        onPress={() => handlePress(btn)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.buttonText,
                            isCancel && styles.buttonCancelText,
                          ]}
                        >
                          {btn.text}
                        </Text>
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

  const alert = (titleOrMessage: string, messageOrButtons?: string | AlertButton[], maybeButtons?: AlertButton[]) => {
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

    setAlertState({
      visible: true,
      title: title ? getUserFriendlyTitle(title) : title,
      message: getUserFriendlyMessage(message),
      buttons,
    });
  };

  const dismiss = () => {
    setAlertState(prev => ({ ...prev, visible: false }));
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

const createStyles = (themeColors: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: themeColors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
    },
    card: {
      width: '100%',
      maxWidth: 340,
      maxHeight: '85%',
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: themeColors.glassBorder,
      ...Shadows.xl,
    },
    gradient: {
      padding: Spacing.xl,
      alignItems: 'center',
    },
    gradientActionList: {
      paddingHorizontal: 0,
      paddingBottom: 0,
      paddingTop: Spacing.xl,
    },
    closeButton: {
      position: 'absolute',
      top: Spacing.sm,
      right: Spacing.sm,
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: themeColors.glass,
      zIndex: 10,
    },
    standardHeaderArea: {
      alignItems: 'center',
      width: '100%',
    },
    headerArea: {
      alignItems: 'center',
      width: '100%',
      paddingHorizontal: Spacing.xl,
    },
    title: {
      fontSize: 18,
      fontWeight: '800',
      color: themeColors.text,
      marginBottom: Spacing.xs,
      textAlign: 'center',
    },
    message: {
      fontSize: 14,
      color: themeColors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: Spacing.xl,
    },
    messageNoTitle: {
      marginTop: Spacing.sm,
    },
    messageActionList: {
      marginBottom: Spacing.md,
    },
    actionList: {
      width: '100%',
      borderTopWidth: 1,
      borderTopColor: themeColors.glassBorder,
    },
    actionItem: {
      width: '100%',
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionDivider: {
      borderTopWidth: 1,
      borderTopColor: themeColors.glassBorder,
    },
    actionText: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.text,
    },
    actionTextDestructive: {
      color: themeColors.error,
      fontWeight: '600',
    },
    actionTextCancel: {
      color: themeColors.textSecondary,
      fontWeight: '500',
    },
    buttonRow: {
      flexDirection: 'row',
      width: '100%',
      gap: 12,
    },
    singleButtonRow: {
      justifyContent: 'center',
    },
    button: {
      flex: 1,
      height: 46,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    singleButton: {
      flex: 0,
      minWidth: 140,
    },
    buttonPrimary: {
      backgroundColor: themeColors.primary,
    },
    buttonDestructive: {
      backgroundColor: themeColors.error,
    },
    buttonCancel: {
      backgroundColor: themeColors.surfaceLight,
      borderWidth: 1,
      borderColor: themeColors.glassBorder,
    },
    buttonText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    buttonCancelText: {
      color: themeColors.textSecondary,
      fontWeight: '600',
    },
  });
