/**
 * Date and Birthday Utilities
 *
 * Provides safe parsing, formatting, and age calculation for user date of birth (DOB)
 * without timezone off-by-one shifts (e.g. UTC midnight shifts).
 */

const DOB_DATE_PATTERN = /^(?:\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{4})$/;

const parseDobDateParts = (value: string): Date | null => {
  const clean = value.trim().split('T')[0];
  if (!clean) return null;

  const build = (year: number, month: number, day: number): Date | null => {
    if (!(year > 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31)) return null;
    const date = new Date(year, month - 1, day);
    // Reject rolled-over dates such as 1998-02-30.
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return null;
    }
    return date;
  };

  // YYYY-MM-DD / YYYY/MM/DD / YYYY.MM.DD
  let match = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (match) {
    return build(Number(match[1]), Number(match[2]), Number(match[3]));
  }

  // DD-MM-YYYY / DD/MM/YYYY / DD.MM.YYYY (e.g. 15/05/1998)
  match = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (match) {
    return build(Number(match[3]), Number(match[2]), Number(match[1]));
  }

  return null;
};

export const parseDobToLocalDate = (dob?: string | null | Date): Date => {
  if (!dob) return new Date(2000, 0, 1);
  if (dob instanceof Date) {
    return new Date(dob.getFullYear(), dob.getMonth(), dob.getDate());
  }
  const fromParts = parseDobDateParts(String(dob));
  if (fromParts) return fromParts;
  // Recognised but invalid calendar date (e.g. 1998-02-30): don't let the JS
  // Date parser silently roll it over into a different day.
  if (DOB_DATE_PATTERN.test(String(dob).trim().split('T')[0])) return new Date(2000, 0, 1);
  const parsed = new Date(dob);
  return isNaN(parsed.getTime())
    ? new Date(2000, 0, 1)
    : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

export const formatDateToDobString = (dateInput?: Date | string | null): string => {
  if (!dateInput) return '2000-01-01';
  if (typeof dateInput === 'string') {
    const clean = dateInput.trim().split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
    const parsed = parseDobToLocalDate(clean);
    return formatDateToDobString(parsed);
  }
  const y = dateInput.getFullYear();
  const m = String(dateInput.getMonth() + 1).padStart(2, '0');
  const d = String(dateInput.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Parses a DOB into a local Date, returning `null` when the value is missing
 * or cannot be interpreted. Unlike `parseDobToLocalDate`, this never falls
 * back to a fake date, so callers can distinguish "unknown" from a real value.
 */
export const tryParseDobToLocalDate = (dob?: string | null | Date): Date | null => {
  if (!dob) return null;
  if (dob instanceof Date) {
    if (isNaN(dob.getTime())) return null;
    return new Date(dob.getFullYear(), dob.getMonth(), dob.getDate());
  }
  const fromParts = parseDobDateParts(String(dob));
  if (fromParts) return fromParts;
  // Recognised but invalid calendar date (e.g. 1998-02-30): reject instead of
  // letting the JS Date parser roll it over into a different day.
  if (DOB_DATE_PATTERN.test(String(dob).trim().split('T')[0])) return null;
  const parsed = new Date(dob);
  if (isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

/**
 * Timezone-safe age in years, computed from the local calendar date.
 * Returns `null` for missing/invalid DOB instead of inventing an age.
 */
export const getAgeFromDob = (dob?: string | Date | null): number | null => {
  const d = tryParseDobToLocalDate(dob);
  if (!d) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) {
    age -= 1;
  }
  return age > 0 ? age : null;
};

export const calculateAgeFromDob = (dob?: string | Date | null): number => {
  // Return 0 ("unknown") instead of inventing an age when the DOB is missing
  // or invalid. Callers must treat 0 as unknown rather than a real age.
  return getAgeFromDob(dob) ?? 0;
};

export const isValidAdultDob = (dob?: string | Date | null): boolean => {
  const age = calculateAgeFromDob(dob);
  return !isNaN(age) && age >= 18 && age <= 120;
};
