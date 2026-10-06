import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DatePicker from 'react-native-date-picker';
import { Colors, useTheme } from '../../../theme';

interface YourBirthdayProps {
  value: string;
  onChange: (val: string) => void;
}

const YourBirthday: React.FC<YourBirthdayProps> = ({ value, onChange }) => {
  const { themeColors, isDark } = useTheme();
  const [open, setOpen] = useState(false);

  const dateObj = value ? new Date(value) : new Date(2000, 0, 1);
  const safeDate = isNaN(dateObj.getTime()) ? new Date(2000, 0, 1) : dateObj;

  const day = String(safeDate.getDate());
  const month = String(safeDate.getMonth() + 1);
  const year = String(safeDate.getFullYear());

  const handleConfirm = (date: Date) => {
    setOpen(false);
    const yr = date.getFullYear();
    const mo = ('0' + (date.getMonth() + 1)).slice(-2);
    const dy = ('0' + date.getDate()).slice(-2);
    onChange(`${yr}-${mo}-${dy}`);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: themeColors.text }]}>Select your birthday</Text>

      <View style={styles.boxesRow}>
        <TouchableOpacity
          style={[styles.box, { backgroundColor: themeColors.surfaceLight, borderColor: themeColors.borderLight }]}
          onPress={() => setOpen(true)}
          activeOpacity={0.8}
        >
          <Text style={[styles.boxText, { color: themeColors.text }]}>{day}</Text>
        </TouchableOpacity>

        <Text style={[styles.slash, { color: themeColors.textSecondary }]}>/</Text>

        <TouchableOpacity
          style={[styles.box, { backgroundColor: themeColors.surfaceLight, borderColor: themeColors.borderLight }]}
          onPress={() => setOpen(true)}
          activeOpacity={0.8}
        >
          <Text style={[styles.boxText, { color: themeColors.text }]}>{month}</Text>
        </TouchableOpacity>

        <Text style={[styles.slash, { color: themeColors.textSecondary }]}>/</Text>

        <TouchableOpacity
          style={[styles.box, styles.yearBox, { backgroundColor: themeColors.surfaceLight, borderColor: themeColors.borderLight }]}
          onPress={() => setOpen(true)}
          activeOpacity={0.8}
        >
          <Text style={[styles.boxText, { color: themeColors.text }]}>{year}</Text>
        </TouchableOpacity>
      </View>

      <DatePicker
        modal
        open={open}
        date={safeDate}
        mode="date"
        theme={isDark ? 'dark' : 'light'}
        maximumDate={new Date()}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </View>
  );
};

export default YourBirthday;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 22,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  boxesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  box: {
    minWidth: 56,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearBox: {
    minWidth: 76,
  },
  boxText: {
    fontSize: 16,
    fontWeight: '600',
  },
  slash: {
    fontSize: 20,
    fontWeight: '600',
    marginHorizontal: 12,
  },
});
