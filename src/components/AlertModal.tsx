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
import { Colors, Spacing, Typography } from '../theme';

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
    btn.onPress?.();
    onDismiss?.();
  };

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
            colors={[Colors.surface, Colors.surfaceLight]}
            style={styles.gradient}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onDismiss}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>

            {title && <Text style={styles.title}>{title}</Text>}
            <Text style={[styles.message, !title && styles.messageNoTitle]}>{message}</Text>

            {buttons && buttons.length > 0 && (
              <View style={[styles.buttonRow, buttons.length === 1 && styles.singleButton]}>
                {buttons.map((btn, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.button,
                      btn.style === 'destructive' && { backgroundColor: Colors.error },
                      btn.style === 'cancel' && { backgroundColor: Colors.surfaceLighter },
                      index === 0 && buttons.length > 1 && styles.buttonFirst,
                      index === buttons.length - 1 && buttons.length > 1 && styles.buttonLast,
                    ]}
                    onPress={() => handlePress(btn)}
                    activeOpacity={0.8}
                  >
                    {btn.style === 'cancel' ? (
                      <View style={[styles.buttonInner, { backgroundColor: Colors.surfaceLighter }]}>
                        <Text style={[styles.buttonText, { color: Colors.textSecondary }]}>
                          {btn.text}
                        </Text>
                      </View>
                    ) : btn.style === 'destructive' ? (
                      <View style={[styles.buttonInner, { backgroundColor: Colors.error }]}>
                        <Text style={styles.buttonText}>{btn.text}</Text>
                      </View>
                    ) : (
                      <LinearGradient
                        colors={[Colors.primary, Colors.secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.buttonInner}
                      >
                        <Text style={styles.buttonText}>{btn.text}</Text>
                      </LinearGradient>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
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

    setAlertState({ visible: true, title, message, buttons });
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: Spacing.radiusXl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  gradient: {
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.glass,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xxl,
  },
  messageNoTitle: {
    marginTop: Spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing.sm,
  },
  singleButton: {
    justifyContent: 'center',
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: Spacing.radiusMd,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonFirst: {
    marginRight: 0,
  },
  buttonLast: {
    marginLeft: 0,
  },
  gradientButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
});
