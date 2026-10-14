import { ONBOARDING_ROUTES } from '../src/utils/session';

describe('Onboarding Flow Navigation', () => {
  it('includes all sequential onboarding steps in ONBOARDING_ROUTES', () => {
    expect(ONBOARDING_ROUTES.has('Privacy')).toBe(true);
    expect(ONBOARDING_ROUTES.has('GenderOrientation')).toBe(true);
    expect(ONBOARDING_ROUTES.has('DisplayName')).toBe(true);
    expect(ONBOARDING_ROUTES.has('SelfieVerification')).toBe(true);
    expect(ONBOARDING_ROUTES.has('UploadImage')).toBe(true);
    expect(ONBOARDING_ROUTES.has('ConnectTelegram')).toBe(true);
  });

  it('maintains expected 8-step progress sequence', () => {
    const stepsInOrder = [
      'GenderOrientation', // Step 1
      'DisplayName',       // Step 2
      'SelfieVerification',// Step 3
      'UploadImage',       // Step 4
      'ConnectTelegram',   // Step 5
      'AboutProfile',      // Step 6: About you
      'TellUsMore',        // Step 7: About me fields (part 1)
      'MoreDetails',       // Step 8: About me fields (part 2)
    ];

    stepsInOrder.forEach((step) => {
      expect(ONBOARDING_ROUTES.has(step)).toBe(true);
    });
  });
});
