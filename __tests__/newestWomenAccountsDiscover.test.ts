import { isFemaleGenderValue, isMaleGenderValue } from '../src/components/HomeTabComponents/UserList';

describe('Newest Tab Woman Accounts Discover & Gender Orientation Resolution', () => {
  test('isFemaleGenderValue correctly matches all variations of woman', () => {
    expect(isFemaleGenderValue('woman')).toBe(true);
    expect(isFemaleGenderValue('straight_woman')).toBe(true);
    expect(isFemaleGenderValue('female')).toBe(true);
    expect(isFemaleGenderValue('Female')).toBe(true);
    expect(isFemaleGenderValue('Woman')).toBe(true);
    expect(isFemaleGenderValue('F')).toBe(true);
    expect(isFemaleGenderValue('f')).toBe(true);

    expect(isFemaleGenderValue('man')).toBe(false);
    expect(isFemaleGenderValue('male')).toBe(false);
    expect(isFemaleGenderValue('straight_man')).toBe(false);
  });

  test('isMaleGenderValue does not mistakenly match straight_woman or woman', () => {
    expect(isMaleGenderValue('man')).toBe(true);
    expect(isMaleGenderValue('male')).toBe(true);
    expect(isMaleGenderValue('straight_man')).toBe(true);
    expect(isMaleGenderValue('Male')).toBe(true);
    expect(isMaleGenderValue('Man')).toBe(true);

    // CRITICAL: straight_woman contains "man", but must NOT be treated as male!
    expect(isMaleGenderValue('woman')).toBe(false);
    expect(isMaleGenderValue('straight_woman')).toBe(false);
    expect(isMaleGenderValue('female')).toBe(false);
    expect(isMaleGenderValue('Female')).toBe(false);
  });

  test('Gender orientation resolution correctly identifies women without substring collision', () => {
    const resolveGender = (candidate: string | null) => {
      const clean = String(candidate || '').toLowerCase().trim();
      if (clean.includes('woman') || clean.includes('female') || clean === 'straight_woman') {
        return { gender: 'woman', orientation: 'straight' };
      }
      if (
        (clean.includes('man') && !clean.includes('woman')) ||
        (clean.includes('male') && !clean.includes('female')) ||
        clean === 'straight_man'
      ) {
        return { gender: 'man', orientation: 'straight' };
      }
      if (clean.includes('lgbtq')) {
        return { gender: 'lgbtqia', orientation: 'lgbtqia' };
      }
      return { gender: 'woman', orientation: 'straight' };
    };

    expect(resolveGender('straight_woman')).toEqual({ gender: 'woman', orientation: 'straight' });
    expect(resolveGender('woman')).toEqual({ gender: 'woman', orientation: 'straight' });
    expect(resolveGender('Female')).toEqual({ gender: 'woman', orientation: 'straight' });
    expect(resolveGender('straight_man')).toEqual({ gender: 'man', orientation: 'straight' });
    expect(resolveGender('man')).toEqual({ gender: 'man', orientation: 'straight' });
    expect(resolveGender('Male')).toEqual({ gender: 'man', orientation: 'straight' });
    expect(resolveGender('lgbtqia')).toEqual({ gender: 'lgbtqia', orientation: 'lgbtqia' });
  });
});
