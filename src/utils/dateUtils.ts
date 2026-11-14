/**
 * Date and Birthday Utilities
 *
 * Provides safe parsing, formatting, and age calculation for user date of birth (DOB)
 * without timezone off-by-one shifts (e.g. UTC midnight shifts).
 */

export const parseDobToLocalDate = (dob?: string | null | Date): Date => {
  if (!dob) return new Date(2000, 0, 1);
  if (dob instanceof Date) {
    return new Date(dob.getFullYear(), dob.getMonth(), dob.getDate());
  }
  const clean = String(dob).trim().split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d) && y > 1900 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return new Date(y, m - 1, d);
    }
  }
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

export const calculateAgeFromDob = (dob?: string | Date | null): number => {
  if (!dob) return 21;
  const d = parseDobToLocalDate(dob);
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) {
    age -= 1;
  }
  return age > 0 ? age : 21;
};

export const isValidAdultDob = (dob?: string | Date | null): boolean => {
  const age = calculateAgeFromDob(dob);
  return !isNaN(age) && age >= 18 && age <= 120;
};
