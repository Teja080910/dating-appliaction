import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  BackHandler,
  Dimensions,
  Image,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import AppContext from '../../context/CreateGlobalStateContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const OVAL_WIDTH = SCREEN_WIDTH * 0.70;
const OVAL_HEIGHT = OVAL_WIDTH * 1.35;

const FaceVerificationScreen = ({ navigation }: any) => {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const { images } = useContext(AppContext);
  const profileImage = images[0]; // Comparison photo

  const [isScanning, setIsScanning] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scanAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.replace('UploadImage');
        return true;
      };
      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backHandler.remove();
    }, [navigation]),
  );

  useEffect(() => {
    if (isScanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scanAnim.setValue(0);
    }
  }, [isScanning]);

  const handleStartVerification = () => {
    if (!hasPermission) {
        requestPermission();
        return;
    }
    setError(null);
    setIsScanning(true);
    
    // Simulate Face Detection & Comparison
    setTimeout(() => {
      setIsScanning(false);
      setIsVerified(true);
    }, 4000);
  };

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, OVAL_HEIGHT - 4],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Face Verification</Text>
          <Text style={[styles.subtitle, error && styles.errorText]}>
            {error || 'Center your face in the oval and keep it still'}
          </Text>
        </View>
        {profileImage && (
          <View style={styles.profileThumbnailContainer}>
            <Image source={{ uri: profileImage }} style={styles.profileThumbnail} />
            <Text style={styles.comparisonLabel}>Profile</Text>
          </View>
        )}
      </View>

      <View style={styles.cameraFrameContainer}>
        <View style={[styles.ovalFrame, error && styles.errorFrame]}>
          {hasPermission && device ? (
            <Camera
              style={styles.fullCamera}
              device={device}
              isActive={true}
            />
          ) : (
            <ActivityIndicator size="large" color="#FF5A79" />
          )}

          {isScanning && (
            <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />
          )}

          {isScanning && (
            <View style={styles.scanningStatus}>
              <Text style={styles.scanningText}>SCANNING...</Text>
            </View>
          )}

          {isVerified && (
            <View style={styles.successOverlay}>
                <Icon name="check-circle" size={80} color="#fff" />
                <Text style={styles.successText}>VERIFIED</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorOverlay}>
                <Icon name="alert-circle" size={50} color="#fff" />
            </View>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        {!isVerified && !isScanning && (
            <TouchableOpacity style={styles.primaryButton} onPress={handleStartVerification}>
                <Text style={styles.buttonText}>Start Verification</Text>
            </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.nextButton, !isVerified && styles.disabledButton]}
          onPress={() => isVerified && navigation.navigate('AboutProfile')}
          disabled={!isVerified}
        >
          <Text style={styles.nextButtonText}>Go to final step</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default FaceVerificationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    paddingVertical: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    maxWidth: SCREEN_WIDTH * 0.6,
    lineHeight: 20,
  },
  errorText: {
    color: '#FF5A79',
    fontWeight: 'bold',
  },
  profileThumbnailContainer: {
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF5A79',
    borderRadius: 10,
    padding: 2,
  },
  profileThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  comparisonLabel: {
    fontSize: 10,
    color: '#FF5A79',
    fontWeight: 'bold',
    marginTop: 2,
  },
  cameraFrameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ovalFrame: {
    width: OVAL_WIDTH,
    height: OVAL_HEIGHT,
    borderRadius: OVAL_WIDTH / 2,
    borderWidth: 4,
    borderColor: '#FF5A79',
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
    elevation: 10,
    shadowColor: '#FF5A79',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
  },
  errorFrame: {
    borderColor: '#FF0000',
  },
  fullCamera: {
    flex: 1,
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#FF5A79',
    shadowColor: '#FF5A79',
    shadowRadius: 10,
    shadowOpacity: 1,
    elevation: 10,
  },
  scanningStatus: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(209, 63, 86, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scanningText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 2,
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(209, 63, 86, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 24,
    marginTop: 15,
    letterSpacing: 4,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: 25,
    paddingBottom: 40,
    gap: 15,
  },
  primaryButton: {
    backgroundColor: '#FF5A79',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#FF5A79',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
    elevation: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
