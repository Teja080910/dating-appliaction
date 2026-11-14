import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import DatePicker from 'react-native-date-picker';
import { Colors, useTheme } from '../../../theme';
import { t, useTranslation } from '../../../i18n';
import { parseDobToLocalDate, formatDateToDobString, calculateAgeFromDob } from '../../../utils/dateUtils';

interface YourBirthdayProps {
  value: string;
  onChange: (val: string) => void;
}

const YourBirthday: React.FC<YourBirthdayProps> = ({ value, onChange }) => {
  useTranslation();
  const { themeColors, isDark } = useTheme();
  const [open, setOpen] = useState(false);

  const maxSelectableDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d;
  }, []);

  const minSelectableDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 100);
    return d;
  }, []);

  const { day, month, year, safeDate } = useMemo(() => {
    const parsed = parseDobToLocalDate(value);
    const validDate = isNaN(parsed.getTime()) || parsed > maxSelectableDate ? maxSelectableDate : parsed;

    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
      const parts = value.trim().split('-');
      return {
        day: String(parseInt(parts[2], 10)),
        month: String(parseInt(parts[1], 10)),
        year: String(parseInt(parts[0], 10)),
        safeDate: validDate,
      };
    }
    return {
      day: String(validDate.getDate()),
      month: String(validDate.getMonth() + 1),
      year: String(validDate.getFullYear()),
      safeDate: validDate,
    };
  }, [value, maxSelectableDate]);

  const handleConfirm = (date: Date) => {
    setOpen(false);
    const age = calculateAgeFromDob(date);

    if (isNaN(age) || age < 18) {
      Alert.alert(
        t('onboarding.dobscreen.age_restriction', { defaultValue: 'Age Restriction' }),
        t('onboarding.dobscreen.you_must_be_at_least_18_years_old_to_register', {
          defaultValue: 'You must be at least 18 years old.',
        })
      );
      return;
    }

    const ymd = formatDateToDobString(date);
    onChange(ymd);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: themeColors.text }]}>{t('profile.yourbirthday.select_your_birthday')}</Text>

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
        maximumDate={maxSelectableDate}
        minimumDate={minSelectableDate}
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
