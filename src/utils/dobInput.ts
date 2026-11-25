const digitsOnly = (value: string, maxLength: number) =>
  String(value ?? '').replace(/\D/g, '').slice(0, maxLength);

export const maxDaysInMonth = (
  month?: number | string,
  year?: number | string
): number => {
  const m = Number(month);
  if (!Number.isFinite(m) || m < 1 || m > 12) return 31;
  const y = Number(year);
  const safeYear = Number.isFinite(y) && y >= 1900 ? y : 2000;
  return new Date(safeYear, m, 0).getDate();
};

export const sanitizeDayInput = (
  value: string,
  month?: number | string,
  year?: number | string
): string => {
  let digits = digitsOnly(value, 2);
  if (!digits) return '';

  // A single digit above 3 can only be a padded day (4 -> 04, 9 -> 09).
  if (digits.length === 1 && Number(digits) > 3) {
    digits = `0${digits}`;
  }

  if (digits.length === 2) {
    const n = Number(digits);
    if (n < 1) return '01';
    const max = maxDaysInMonth(month, year);
    if (n > max) return String(max).padStart(2, '0');
  }

  return digits;
};

export const sanitizeMonthInput = (value: string): string => {
  let digits = digitsOnly(value, 2);
  if (!digits) return '';

  // 2-9 can only be a padded month (9 -> 09).
  if (digits.length === 1 && Number(digits) > 1) {
    digits = `0${digits}`;
  }

  if (digits.length === 2) {
    const n = Number(digits);
    if (n < 1) return '01';
    if (n > 12) return '12';
  }

  return digits;
};

export const sanitizeYearInput = (value: string): string => {
  const digits = digitsOnly(value, 4);
  if (digits.length === 4) {
    const n = Number(digits);
    const currentYear = new Date().getFullYear();
    if (n > currentYear) return String(currentYear);
  }
  return digits;
};
