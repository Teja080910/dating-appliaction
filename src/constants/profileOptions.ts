// Canonical option lists shared by onboarding, profile-edit, and
// search-filter screens. Previously each screen kept its own independent
// list for the same conceptual field, so a value picked in one screen could
// be unrecognized/unselectable in another (e.g. "Plus size" chosen at
// onboarding had no matching option in the profile-edit screen). These are
// the union of every list that existed before, so no previously-saved value
// becomes unrepresentable.

export const BODY_TYPES = [
  'Slim',
  'Athletic',
  'Average',
  'Curvy',
  'Muscular',
  'Overweight',
  'Plus size',
  'Other',
];

export const APPEARANCE_OPTIONS = [
  'Very attractive',
  'Attractive',
  'Average',
  'Below Average',
];

export const LOOKING_FOR_OPTIONS = [
  'Hookup',
  'Casual dating',
  'Relationship',
  'Serious relationship',
  'Friendship',
  'Marriage',
  'Online relationship',
  'Open to explore',
];

export const SMOKE_DRINK_OPTIONS = ['Yes', 'No', 'Sometimes', 'Socially'];

export const ENGLISH_LEVELS = ['Bad', 'Medium', 'Good', 'Very Good'];

export const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Romanian',
  'Russian',
  'Chinese',
  'Japanese',
  'Arabic',
  'Hindi',
  'Other',
];
