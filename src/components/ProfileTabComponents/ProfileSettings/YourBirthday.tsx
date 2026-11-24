import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import DatePicker from 'react-native-date-picker';
import { useTheme } from '../../../theme';
import { t, useTranslation } from '../../../i18n';
import { tryParseDobToLocalDate, formatDateToDobString, calculateAgeFromDob } from '../../../utils/dateUtils';

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
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const minSelectableDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 100);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const { day, month, year, safeDate, isOutOfRange, isUnderage } = useMemo(() => {
    const parsed = tryParseDobToLocalDate(value);
    const inRange = Boolean(parsed && parsed >= minSelectableDate && parsed <= maxSelectableDate);
    // Keep the displayed boxes and the picker in sync: when the stored value is
    // outside the selectable range (under 18, future, or invalid), show the same
    // clamped date the picker opens on instead of a date the user can't pick.
    const clamped = inRange && parsed ? parsed : maxSelectableDate;
    return {
      day: String(clamped.getDate()),
      month: String(clamped.getMonth() + 1),
      year: String(clamped.getFullYear()),
      safeDate: clamped,
      isOutOfRange: Boolean(value && value.trim() && !inRange),
      isUnderage: Boolean(parsed && parsed > maxSelectableDate),
    };
  }, [value, maxSelectableDate, minSelectableDate]);

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

      {isOutOfRange ? (
        <Text style={[styles.warning, { color: themeColors.error || '#EF4444' }]}>
          {isUnderage
            ? t('onboarding.dobscreen.you_must_be_at_least_18_years_old_to_register', {
                defaultValue: 'You must be at least 18 years old.',
              })
            : t('onboarding.dobscreen.valid_birthday_required', {
                defaultValue: 'Please choose a valid birthday.',
              })}
        </Text>
      ) : null}

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
  warning: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '500',
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
