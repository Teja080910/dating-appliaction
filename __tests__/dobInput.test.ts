import {
  sanitizeDayInput,
  sanitizeMonthInput,
  sanitizeYearInput,
  maxDaysInMonth,
} from '../src/utils/dobInput';

describe('Birthday input validation', () => {
  it('restricts month to 01-12', () => {
    expect(sanitizeMonthInput('13')).toBe('12');
    expect(sanitizeMonthInput('99')).toBe('12');
    expect(sanitizeMonthInput('00')).toBe('01');
    expect(sanitizeMonthInput('9')).toBe('09');
    expect(sanitizeMonthInput('1')).toBe('1');
    expect(sanitizeMonthInput('12')).toBe('12');
    expect(sanitizeMonthInput('1a3')).toBe('12');
  });

  it('restricts day to the days in the selected month', () => {
    expect(sanitizeDayInput('32')).toBe('31');
    expect(sanitizeDayInput('00')).toBe('01');
    expect(sanitizeDayInput('4')).toBe('04');
    expect(sanitizeDayInput('31', '2', '2024')).toBe('29');
    expect(sanitizeDayInput('31', '2', '2023')).toBe('28');
    expect(sanitizeDayInput('31', '4', '2024')).toBe('30');
  });

  it('restricts year to four digits and not in the future', () => {
    const currentYear = new Date().getFullYear();
    expect(sanitizeYearInput('20a26')).toBe('2026');
    expect(sanitizeYearInput('9999')).toBe(String(currentYear));
    expect(sanitizeYearInput('199')).toBe('199');
  });

  it('knows the number of days in a month', () => {
    expect(maxDaysInMonth('2', '2024')).toBe(29);
    expect(maxDaysInMonth('2', '2023')).toBe(28);
    expect(maxDaysInMonth('4', '2024')).toBe(30);
    expect(maxDaysInMonth('', '')).toBe(31);
  });
});
