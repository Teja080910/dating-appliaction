import React, { useContext, useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import LinearGradient from 'react-native-linear-gradient';
import AppContext from '../../context/CreateGlobalStateContext';
import { profileApi } from '../../api/profileApi';
import { AuthStorage } from '../../api/authStorage';
import { mapGenderToDefaultOrientation } from '../../utils/genderMapping';
import { calculateAge } from '../../utils/dateUtils';
import OnboardingProgressBar from '../../components/onboarding/OnboardingProgressBar';
import { colors, radius, typography } from '../../constants/theme';

const genders = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
];

const BasicDetailsScreen = ({ navigation }: any) => {
  const {
    name, setName, profileText, setProfileText, date, setDate,
    gender, setGender, setOrientation,
    profileCompletion, setProfileCompletion,
  } = useContext(AppContext);

  const [displayName, setDisplayName] = useState(name || '');
  const [bio, setBio] = useState(profileText || '');
  const [selectedGender, setSelectedGender] = useState<string | null>(gender || null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // /profile/me never returns gender/dob (confirmed against the live
    // backend) — only bio/displayName come from here; gender/dob are
    // already in shared context from earlier onboarding screens.
    const prefill = async () => {
      try {
        const userData = await AuthStorage.getUser();
        const uid = userData?.userId;
        if (uid) {
          const data = await profileApi.getMyProfile(uid);
          if (data.displayName) setDisplayName(data.displayName);
          else if (data.name) setDisplayName(data.name);
          if (data.bio) setBio(data.bio);
        }
        if (uid) {
          const pct = await profileApi.getProfileCompletion(uid);
          if (typeof pct === 'number') setProfileCompletion(pct);
        }
      } catch {}
      setLoading(false);
    };
    prefill();
  }, []);

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Please enter your display name');
      return;
    }
    setSaving(true);
    try {
      const userData = await AuthStorage.getUser();
      const uid = userData?.userId;
      if (uid) {
        const dobStr = date ? date.toISOString().split('T')[0] : undefined;
        const age = date ? calculateAge(date) : undefined;
        const orientation = mapGenderToDefaultOrientation(selectedGender);

        await profileApi.saveAllProfile(uid, {
          name: displayName.trim(),
          displayName: displayName.trim(),
          bio: bio.trim() || undefined,
          gender: selectedGender || undefined,
          orientation,
          dob: dobStr,
          age,
        });

        setName(displayName.trim());
        setProfileText(bio.trim());
        setGender(selectedGender);
        setOrientation(orientation);
      }
      navigation.navigate('OnboardingMoreInfo');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const formattedDate = date ? date.toLocaleDateString('en-GB') : 'Select date';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <OnboardingProgressBar percent={profileCompletion} />

        <Text style={styles.title}>Basic Details</Text>
        <Text style={styles.subtitle}>Tell us about yourself</Text>

        <Text style={styles.label}>Display Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Your display name"
          placeholderTextColor={colors.inkFaint}
          value={displayName}
          onChangeText={setDisplayName}
        />

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          placeholder="Write something about yourself..."
          placeholderTextColor={colors.inkFaint}
          value={bio}
          onChangeText={setBio}
          multiline
          maxLength={500}
        />
        <Text style={styles.charCount}>{bio.length} / 500</Text>

        <Text style={styles.label}>Gender</Text>
        <View style={styles.genderRow}>
          {genders.map((g) => (
            <TouchableOpacity
              key={g.value}
              style={[styles.genderBtn, selectedGender === g.value && styles.genderSelected]}
              onPress={() => setSelectedGender(g.value)}
            >
              <Text style={[styles.genderText, selectedGender === g.value && styles.genderTextSelected]}>
                {g.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Date of Birth</Text>
        <TouchableOpacity style={styles.dateDisplay} onPress={() => setOpen(true)}>
          <Text style={styles.dateText}>{formattedDate}</Text>
        </TouchableOpacity>
        <DatePicker
          modal
          open={open}
          date={date || new Date(2004, 9, 7)}
          mode="date"
          maximumDate={new Date()}
          onConfirm={(d) => { setOpen(false); setDate(d); }}
          onCancel={() => setOpen(false)}
        />

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.9}
          style={[saving && { opacity: 0.7 }]}
        >
          <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.nextButton}>
            {saving ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.nextButtonText}>Next</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scrollContent: { padding: 24, paddingBottom: 40 },
  title: { ...typography.title, color: colors.ink, marginBottom: 6 },
  subtitle: { fontSize: 16, color: colors.inkMuted, marginBottom: 24 },
  label: { fontSize: 15, fontWeight: '600', color: colors.ink, marginBottom: 8, marginTop: 16 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 16,
    fontSize: 16, color: colors.ink, backgroundColor: colors.surfaceAlt,
  },
  bioInput: { minHeight: 100, textAlignVertical: 'top' },
  charCount: { textAlign: 'right', color: colors.inkFaint, fontSize: 13, marginTop: 4 },
  genderRow: { flexDirection: 'row', gap: 12 },
  genderBtn: {
    flex: 1, paddingVertical: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', backgroundColor: colors.surfaceAlt,
  },
  genderSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  genderText: { fontSize: 15, color: colors.inkMuted, fontWeight: '500' },
  genderTextSelected: { color: colors.primary, fontWeight: '700' },
  dateDisplay: {
    paddingVertical: 14, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.surfaceAlt,
  },
  dateText: { fontSize: 16, color: colors.ink },
  nextButton: {
    paddingVertical: 16, borderRadius: radius.pill, alignItems: 'center', marginTop: 32,
  },
  nextButtonText: { color: colors.surface, fontWeight: '700', fontSize: 16 },
});

export default BasicDetailsScreen;
