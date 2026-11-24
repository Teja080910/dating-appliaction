import {
  calculateAgeFromDob,
  formatDateToDobString,
  getAgeFromDob,
  tryParseDobToLocalDate,
} from '../src/utils/dateUtils';

const pad = (value: number) => String(value).padStart(2, '0');

describe('Timezone-safe DOB parsing and age', () => {
  it('parses a Y-M-D string as the same local calendar date', () => {
    const parsed = tryParseDobToLocalDate('1998-05-15');
    expect(parsed).not.toBeNull();
    expect(parsed!.getFullYear()).toBe(1998);
    expect(parsed!.getMonth()).toBe(4);
    expect(parsed!.getDate()).toBe(15);
  });

  it('returns null for missing or invalid DOB values', () => {
    expect(tryParseDobToLocalDate(undefined)).toBeNull();
    expect(tryParseDobToLocalDate('')).toBeNull();
    expect(tryParseDobToLocalDate('not-a-date')).toBeNull();
    expect(getAgeFromDob(undefined)).toBeNull();
    expect(getAgeFromDob(null)).toBeNull();
    expect(getAgeFromDob('not-a-date')).toBeNull();
  });

  it('calculateAgeFromDob reports 0 (unknown) instead of inventing an age', () => {
    expect(calculateAgeFromDob(undefined)).toBe(0);
    expect(calculateAgeFromDob(null)).toBe(0);
    expect(calculateAgeFromDob('not-a-date')).toBe(0);
  });

  it('parses dd/mm/yyyy, dd-mm-yyyy and yyyy/mm/dd formats', () => {
    const slashDmy = tryParseDobToLocalDate('15/05/1998');
    expect(slashDmy?.getFullYear()).toBe(1998);
    expect(slashDmy?.getMonth()).toBe(4);
    expect(slashDmy?.getDate()).toBe(15);

    const dashDmy = tryParseDobToLocalDate('15-05-1998');
    expect(dashDmy?.getFullYear()).toBe(1998);
    expect(dashDmy?.getMonth()).toBe(4);
    expect(dashDmy?.getDate()).toBe(15);

    const slashYmd = tryParseDobToLocalDate('1998/05/15');
    expect(slashYmd?.getFullYear()).toBe(1998);
    expect(slashYmd?.getMonth()).toBe(4);
    expect(slashYmd?.getDate()).toBe(15);

    expect(formatDateToDobString('15/05/1998')).toBe('1998-05-15');
    expect(formatDateToDobString('1998-05-15T00:00:00.000Z')).toBe('1998-05-15');
  });

  it('rejects rolled-over dates instead of silently shifting them', () => {
    expect(tryParseDobToLocalDate('1998-02-30')).toBeNull();
    expect(tryParseDobToLocalDate('31/02/1998')).toBeNull();
  });

  it('computes exactly 18 on the local 18th birthday and 17 the day before', () => {
    const today = new Date();

    const birthdayToday = `${today.getFullYear() - 18}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    expect(getAgeFromDob(birthdayToday)).toBe(18);

    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const birthdayTomorrow = `${tomorrow.getFullYear() - 18}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;
    expect(getAgeFromDob(birthdayTomorrow)).toBe(17);
  });
});
