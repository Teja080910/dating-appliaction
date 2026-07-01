import React, { useCallback, useContext, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import Icon from 'react-native-vector-icons/FontAwesome5';
import AppContext from '../../context/CreateGlobalStateContext';
import { useFocusEffect } from '@react-navigation/native';
import { profileApi } from '../../api/profileApi';
import { AuthStorage } from '../../api/authStorage';

const DOBScreen = ({ navigation }: any) => {
  const { date, setDate } = useContext(AppContext);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleNext = async () => {
    setSaving(true);
    try {
      const userIdStr = await AuthStorage.getUserIdStr();
      if (userIdStr) {
        const dobStr = date.toISOString().split('T')[0];
        const age = new Date().getFullYear() - date.getFullYear();
        try {
          await profileApi.updateBasic({
            userId: userIdStr,
            age,
          });
        } catch {}
      }
    } catch {}
    setSaving(false);
    navigation.navigate('UploadImage');
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.replace('DisplayName');
        return true;
      };
      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backHandler.remove();
    }, [navigation]),
  );

  const formattedDate = date.toLocaleDateString('en-GB');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarFill} />
      </View>

      <Text style={styles.title}>When are you born?</Text>

      <TouchableOpacity style={styles.dateDisplay} onPress={() => setOpen(true)}>
        <Text style={styles.dateText}>{formattedDate}</Text>
      </TouchableOpacity>

      <DatePicker
        modal
        open={open}
        date={date}
        mode="date"
        onConfirm={(selectedDate) => {
          setOpen(false);
          setDate(selectedDate);
        }}
        onCancel={() => setOpen(false)}
      />

      <View style={styles.bottomContainer}>
        <View style={styles.infoContainer}>
          <Icon name="info-circle" size={14} color="#999" style={{ marginTop: 2 }} />
          <Text style={styles.infoText}>
            Did you know that you have 100% privacy at Dating? Only the people
            who you have sent an invitation to will be able to view your profile!
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.nextButton, saving && { opacity: 0.7 }]}
          onPress={handleNext}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextButtonText}>Next</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 24 },
  progressBarContainer: {
    height: 5,
    backgroundColor: '#eee',
    marginTop: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '60%',
    height: '100%',
    backgroundColor: '#E94057',
  },
  title: {
    marginTop: 30,
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    color: '#000',
  },
  dateDisplay: {
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: { fontSize: 16, color: '#000' },
  bottomContainer: { marginTop: 'auto', paddingBottom: 30 },
  infoContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  infoText: { fontSize: 12, color: '#999', flex: 1 },
  nextButton: {
    backgroundColor: '#E94057',
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
  },
  nextButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});

export default DOBScreen;
