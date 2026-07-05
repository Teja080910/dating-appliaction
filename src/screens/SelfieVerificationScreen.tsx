import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { requestPermissions } from '../utils/types/permission';
import { profileApi } from '../api/profileApi';
import { AuthStorage } from '../api/authStorage';
import { colors, radius, shadow, typography } from '../constants/theme';

const SelfieVerificationScreen = ({ navigation }: any) => {
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleTakeSelfie = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('Permission denied', 'Camera access is needed to verify your photo.');
      return;
    }
    try {
      const result = await launchCamera({ mediaType: 'photo', quality: 1, cameraType: 'front' });
      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.uri) setSelfieUri(asset.uri);
      } else if (result.errorMessage) {
        Alert.alert('Error', result.errorMessage);
      }
    } catch {
      Alert.alert('Error', 'Something went wrong opening the camera.');
    }
  };

  const handleSubmit = async () => {
    if (!selfieUri) return;
    setUploading(true);
    try {
      const userIdNum = await AuthStorage.getUserId();
      if (!userIdNum) {
        Alert.alert('Error', 'Session expired. Please login again.');
        return;
      }
      await profileApi.uploadSelfie(userIdNum, { uri: selfieUri, type: 'image/jpeg', fileName: 'selfie.jpg' });
      setSubmitted(true);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to submit selfie');
    } finally {
      setUploading(false);
    }
  };

  if (submitted) {
    return (
      <View style={[s.container, s.centered]}>
        <View style={s.successBadge}>
          <Icon name="check" size={30} color={colors.surface} />
        </View>
        <Text style={s.submittedTitle}>Selfie submitted!</Text>
        <Text style={s.submittedText}>
          Our team will review your selfie shortly. You'll see the verified badge on your profile once approved.
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.9} style={s.doneBtnWrap}>
          <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={s.doneBtn}>
            <Text style={s.doneBtnText}>Done</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Verify Your Photo</Text>
      </View>
      <View style={s.content}>
        <Text style={s.instructions}>
          Take a live selfie so we can confirm your profile photos are really you.
          Face the camera directly in good lighting.
        </Text>

        <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={s.previewRing}>
          <View style={s.previewBox}>
            {selfieUri ? (
              <Image source={{ uri: selfieUri }} style={s.preview} />
            ) : (
              <View style={s.previewEmpty}>
                <Icon name="user-circle" size={48} color={colors.inkFaint} />
                <Text style={s.previewPlaceholder}>No selfie taken yet</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        <TouchableOpacity style={s.cameraBtn} onPress={handleTakeSelfie} activeOpacity={0.85}>
          <Icon name="camera" size={15} color={colors.ink} style={{ marginRight: 8 }} />
          <Text style={s.cameraBtnText}>{selfieUri ? 'Retake Selfie' : 'Take Selfie'}</Text>
        </TouchableOpacity>

        {selfieUri ? (
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={uploading}
            activeOpacity={0.9}
            style={[s.submitBtnWrap, uploading && { opacity: 0.7 }]}
          >
            <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={s.submitBtn}>
              {uploading ? <ActivityIndicator color={colors.surface} /> : <Text style={s.submitBtnText}>Submit for Verification</Text>}
            </LinearGradient>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceAlt },
  centered: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  title: { ...typography.title, color: colors.ink },
  content: { paddingHorizontal: 24, paddingTop: 16, alignItems: 'center' },
  instructions: { fontSize: 15, color: colors.inkMuted, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  previewRing: {
    width: 228, height: 228, borderRadius: 114,
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
    padding: 4,
    ...shadow.card,
  },
  previewBox: {
    width: '100%', height: '100%', borderRadius: 110, backgroundColor: colors.surface,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  previewEmpty: { justifyContent: 'center', alignItems: 'center' },
  preview: { width: '100%', height: '100%' },
  previewPlaceholder: { color: colors.inkMuted, fontSize: 13, textAlign: 'center', paddingHorizontal: 20, marginTop: 10 },
  cameraBtn: {
    flexDirection: 'row', backgroundColor: colors.surface, paddingVertical: 14, paddingHorizontal: 32,
    borderRadius: radius.pill, marginBottom: 12, width: '100%', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  cameraBtnText: { color: colors.ink, fontWeight: '700', fontSize: 16 },
  submitBtnWrap: { width: '100%', borderRadius: radius.pill, ...shadow.card },
  submitBtn: {
    paddingVertical: 14, borderRadius: radius.pill, width: '100%', alignItems: 'center',
  },
  submitBtnText: { color: colors.surface, fontWeight: '700', fontSize: 16 },
  successBadge: {
    width: 64, height: 64, borderRadius: radius.pill, backgroundColor: colors.success,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  submittedTitle: { ...typography.heading, color: colors.ink, marginBottom: 12, textAlign: 'center' },
  submittedText: { fontSize: 15, color: colors.inkMuted, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  doneBtnWrap: { borderRadius: radius.pill, ...shadow.card },
  doneBtn: { paddingVertical: 14, paddingHorizontal: 40, borderRadius: radius.pill },
  doneBtnText: { color: colors.surface, fontWeight: '700', fontSize: 16 },
});

export default SelfieVerificationScreen;
