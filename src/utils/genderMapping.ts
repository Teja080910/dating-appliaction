export const mapGenderToDefaultOrientation = (gender: string | null | undefined): string => {
  if (gender === 'male') return 'straight_man';
  if (gender === 'female') return 'straight_woman';
  return 'lgbtqia';
};
