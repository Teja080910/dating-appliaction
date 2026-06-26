import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, Spacing } from '../../../theme';

interface YourBirthdayProps {
  value: string;
  onChange: (val: string) => void;
}

const YourBirthday: React.FC<YourBirthdayProps> = ({ value, onChange }) => {
  const [showPicker, setShowPicker] = useState(false);

  const dateObj = value ? new Date(value) : new Date();

  const handleChange = (event: any, selectedDate: Date | undefined) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) {
      const yr = selectedDate.getFullYear();
      const mo = ('0' + (selectedDate.getMonth() + 1)).slice(-2);
      const dy = ('0' + selectedDate.getDate()).slice(-2);
      onChange(`${yr}-${mo}-${dy}`);
    }
  };

  const formatDate = (val: string) => {
    if (!val) return 'Select date';
    const [y, m, d] = val.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your birthday</Text>
      <Text style={styles.subtitle}>When were you born?</Text>

      <TouchableOpacity style={styles.inputBox} onPress={() => setShowPicker(true)}>
        <Text style={styles.dateText}>{formatDate(value)}</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={dateObj}
          mode="date"
          display="calendar"
          onChange={handleChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 12,
  },
  inputBox: {
    backgroundColor: Colors.inputBackground,
    padding: 14,
    borderRadius: Spacing.radiusMd,
    borderColor: Colors.glassBorder,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
});

export default YourBirthday;
