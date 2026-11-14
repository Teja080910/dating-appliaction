describe('Under-18 Age Restriction Enforcement (Male & Female)', () => {
  const calculateAge = (d: number, m: number, y: number) => {
    const today = new Date();
    const birthDate = new Date(y, m - 1, d);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const calculateAgeFromDobString = (dobStr: string) => {
    const dob = new Date(dobStr);
    if (isNaN(dob.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const monthGap = now.getMonth() - dob.getMonth();
    if (monthGap < 0 || (monthGap === 0 && now.getDate() < dob.getDate())) {
      age -= 1;
    }
    return age;
  };

  test('blocks birth dates where age is strictly below 18', () => {
    const today = new Date();
    // 17 years old (born 17 years ago today + 1 day)
    const underageYear = today.getFullYear() - 17;
    const age17 = calculateAge(today.getDate(), today.getMonth() + 1, underageYear);
    expect(age17).toBeLessThan(18);

    // 10 years old
    const age10 = calculateAge(1, 1, today.getFullYear() - 10);
    expect(age10).toBe(10);
    expect(age10 < 18).toBe(true);

    // 18 years old today
    const adultYear = today.getFullYear() - 18;
    const age18 = calculateAge(today.getDate(), today.getMonth() + 1, adultYear);
    expect(age18).toBe(18);
    expect(age18 >= 18).toBe(true);

    // 25 years old
    const age25 = calculateAge(1, 1, today.getFullYear() - 25);
    expect(age25).toBeGreaterThanOrEqual(18);
  });

  test('validates date existence (blocks invalid dates like Feb 31)', () => {
    const validateDate = (d: number, m: number, y: number) => {
      const testDate = new Date(y, m - 1, d);
      return (
        testDate.getFullYear() === y &&
        testDate.getMonth() === m - 1 &&
        testDate.getDate() === d
      );
    };

    expect(validateDate(31, 2, 2000)).toBe(false);
    expect(validateDate(31, 4, 2000)).toBe(false);
    expect(validateDate(15, 5, 2000)).toBe(true);
  });

  test('filter out underage profiles in discovery (keepInvitableProfiles logic)', () => {
    const mockList = [
      { id: 'usr_adult_woman', gender: 'woman', age: 22, dob: '2004-01-01' },
      { id: 'usr_adult_man', gender: 'man', age: 26, dob: '2000-05-15' },
      { id: 'usr_minor_girl', gender: 'woman', age: 16, dob: '2010-02-10' },
      { id: 'usr_minor_boy', gender: 'man', age: 17, dob: '2009-08-20' },
    ];

    const keepInvitableProfiles = (items: any[]) =>
      items.filter((item) => {
        const rawAge = item?.age;
        const dob = item?.dob;
        if (dob) {
          const d = new Date(dob);
          if (!isNaN(d.getTime())) {
            const today = new Date();
            let calcAge = today.getFullYear() - d.getFullYear();
            const m = today.getMonth() - d.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < d.getDate())) {
              calcAge -= 1;
            }
            if (calcAge < 18) return false;
          }
        }
        if (rawAge !== undefined && rawAge !== null && Number(rawAge) < 18) {
          return false;
        }
        return true;
      });

    const filtered = keepInvitableProfiles(mockList);
    expect(filtered.length).toBe(2);
    expect(filtered.map((u: any) => u.id)).toEqual(['usr_adult_woman', 'usr_adult_man']);
  });

  test('validates Edit Profile computedAge rejects underage DOB strings', () => {
    const now = new Date();
    const minorDob = `${now.getFullYear() - 16}-05-10`;
    const adultDob = `${now.getFullYear() - 21}-05-10`;

    const minorAge = calculateAgeFromDobString(minorDob);
    const adultAge = calculateAgeFromDobString(adultDob);

    expect(minorAge).toBe(16);
    expect(minorAge! < 18).toBe(true);

    expect(adultAge).toBe(21);
    expect(adultAge! >= 18).toBe(true);
  });
});
