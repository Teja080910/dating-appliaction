import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast, { ToastConfig, ToastConfigParams } from 'react-native-toast-message';

interface AmaraToastItemProps extends ToastConfigParams<any> {
  variant: 'success' | 'error' | 'info';
}

const variantConfig = {
  success: {
    borderColor: 'rgba(16, 185, 129, 0.45)',
    accentColor: '#10B981',
    iconBg: 'rgba(16, 185, 129, 0.16)',
    iconColor: '#10B981',
    iconName: 'check-circle',
    textColor2: '#E2E8F0',
  },
  error: {
    borderColor: 'rgba(239, 68, 68, 0.50)',
    accentColor: '#EF4444',
    iconBg: 'rgba(239, 68, 68, 0.16)',
    iconColor: '#EF4444',
    iconName: 'alert-circle',
    textColor2: '#FECDD3',
  },
  info: {
    borderColor: 'rgba(168, 85, 247, 0.45)',
    accentColor: '#A855F7',
    iconBg: 'rgba(168, 85, 247, 0.18)',
    iconColor: '#A855F7',
    iconName: 'information',
    textColor2: '#E2E8F0',
  },
};

const AmaraToastItem: React.FC<AmaraToastItemProps> = ({
  text1,
  text2,
  onPress,
  hide,
  variant,
}) => {
  const conf = variantConfig[variant] || variantConfig.info;

  const handlePress = () => {
    if (typeof onPress === 'function') {
      onPress();
    } else if (typeof hide === 'function') {
      hide();
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={handlePress}
      style={[styles.container, { borderColor: conf.borderColor }]}
    >
      {/* Left vertical accent line */}
      <View style={[styles.accentBar, { backgroundColor: conf.accentColor }]} />

      {/* Circular Icon badge */}
      <View style={[styles.iconWrap, { backgroundColor: conf.iconBg }]}>
        <Icon name={conf.iconName} size={22} color={conf.iconColor} />
      </View>

      {/* Text Container */}
      <View style={styles.textContainer}>
        {Boolean(text1) && (
          <Text style={styles.title} numberOfLines={1}>
            {text1}
          </Text>
        )}
        {Boolean(text2) && (
          <Text style={[styles.subtitle, { color: conf.textColor2 }]} numberOfLines={2}>
            {text2}
          </Text>
        )}
      </View>

      {/* Close Button */}
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={() => hide()}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        activeOpacity={0.6}
      >
        <Icon name="close" size={14} color="rgba(255, 255, 255, 0.65)" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export const toastConfig: ToastConfig = {
  success: (props: ToastConfigParams<any>) => (
    <AmaraToastItem {...props} variant="success" />
  ),
  error: (props: ToastConfigParams<any>) => (
    <AmaraToastItem {...props} variant="error" />
  ),
  info: (props: ToastConfigParams<any>) => (
    <AmaraToastItem {...props} variant="info" />
  ),
};

export const showSuccessToast = (text1: string, text2?: string, visibilityTime = 3000) => {
  Toast.show({
    type: 'success',
    text1,
    text2,
    visibilityTime,
  });
};

export const showErrorToast = (text1: string, text2?: string, visibilityTime = 3500) => {
  Toast.show({
    type: 'error',
    text1,
    text2,
    visibilityTime,
  });
};

export const showInfoToast = (text1: string, text2?: string, visibilityTime = 2500) => {
  Toast.show({
    type: 'info',
    text1,
    text2,
    visibilityTime,
  });
};

const styles = StyleSheet.create({
  container: {
    width: '92%',
    maxWidth: 420,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E193B',
    borderRadius: 18,
    borderWidth: 1.2,
    paddingVertical: 12,
    paddingHorizontal: 14,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 14,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  accentBar: {
    width: 3.5,
    height: 28,
    borderRadius: 2,
    marginRight: 10,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.15,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 2,
    lineHeight: 18,
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
});

export default toastConfig;
