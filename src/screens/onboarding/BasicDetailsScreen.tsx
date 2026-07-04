import React, { useContext, useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView,
  StatusBar, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import AppContext from '../../context/CreateGlobalStateContext';
import { profileApi } from '../../api/profileApi';
import { AuthStorage } from '../../api/authStorage';

const genders = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
];

const BasicDetailsScreen = ({ navigation }: any) => {
  const {
    name, setName, profileText, setProfileText, date, setDate,
  } = useContext(AppContext);

  const [displayName, setDisplayName] = useState(name || '');
  const [bio, setBio] = useState(profileText || '');
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const prefill = async () => {
      try {
        const userData = await AuthStorage.getUser();
        const uid = userData?.userId;
        if (uid) {
          const data = await profileApi.getMyProfile(uid);
          if (data.displayName) setDisplayName(data.displayName);
          if (data.name) setDisplayName(data.name);
          if (data.bio) setBio(data.bio);
          if (data.gender) setSelectedGender(data.gender);
          if (data.dob) {
            const parsed = new Date(data.dob);
            if (!isNaN(parsed.getTime())) setDate(parsed);
          }
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
        const age = date ? new Date().getFullYear() - date.getFullYear() : undefined;

        await profileApi.saveAllProfile(uid, {
          name: displayName.trim(),
          displayName: displayName.trim(),
          bio: bio.trim() || undefined,
          gender: selectedGender || undefined,
          orientation: selectedGender === 'male' ? 'straight_man' : selectedGender === 'female' ? 'straight_woman' : 'lgbtqia',
          dob: dobStr,
          age,
        });

        setName(displayName.trim());
        setProfileText(bio.trim());
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
        <ActivityIndicator size="large" color="#E94057" />
      </View>
    );
  }

  const formattedDate = date ? date.toLocaleDateString('en-GB') : 'Select date';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressFill} />
        </View>

        <Text style={styles.title}>Basic Details</Text>
        <Text style={styles.subtitle}>Tell us about yourself</Text>

        <Text style={styles.label}>Display Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Your display name"
          placeholderTextColor="#999"
          value={displayName}
          onChangeText={setDisplayName}
        />

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          placeholder="Write something about yourself..."
          placeholderTextColor="#999"
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
          style={[styles.nextButton, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextButtonText}>Next</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 24, paddingBottom: 40 },
  progressBarContainer: {
    height: 4, backgroundColor: '#e0e0e0', borderRadius: 2, overflow: 'hidden', marginBottom: 24,
  },
  progressFill: { width: '50%', height: '100%', backgroundColor: '#E94057' },
  title: { fontSize: 26, fontWeight: '700', color: '#1a1a1a', marginBottom: 6 },
  subtitle: { fontSize: 16, color: '#888', marginBottom: 24 },
  label: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 16 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16,
    fontSize: 16, color: '#000', backgroundColor: '#fafafa',
  },
  bioInput: { minHeight: 100, textAlignVertical: 'top' },
  charCount: { textAlign: 'right', color: '#999', fontSize: 13, marginTop: 4 },
  genderRow: { flexDirection: 'row', gap: 12 },
  genderBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#ddd',
    alignItems: 'center', backgroundColor: '#fafafa',
  },
  genderSelected: { borderColor: '#E94057', backgroundColor: '#fff0f3' },
  genderText: { fontSize: 15, color: '#666', fontWeight: '500' },
  genderTextSelected: { color: '#E94057', fontWeight: '700' },
  dateDisplay: {
    paddingVertical: 14, paddingHorizontal: 16, borderWidth: 1, borderColor: '#ddd',
    borderRadius: 12, alignItems: 'center', backgroundColor: '#fafafa',
  },
  dateText: { fontSize: 16, color: '#000' },
  nextButton: {
    backgroundColor: '#E94057', paddingVertical: 16, borderRadius: 30, alignItems: 'center', marginTop: 32,
  },
  nextButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default BasicDetailsScreen;
