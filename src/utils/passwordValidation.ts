/**
 * Strong password validation utility for Amara dating app.
 * Aligns client-side form validations and error handling with backend strong password policies.
 */

export interface PasswordRequirement {
  id: string;
  label: string;
  met: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0 - 5
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  requirements: PasswordRequirement[];
  errors: string[];
}

/**
 * Validates whether a password meets the backend's strong password requirements:
 * 1. Minimum 8 characters in length
 * 2. At least one uppercase letter (A-Z)
 * 3. At least one lowercase letter (a-z)
 * 4. At least one numeric digit (0-9)
 * 5. At least one special character (!@#$%^&* etc.)
 */
export const validateStrongPassword = (password: string | null | undefined): PasswordValidationResult => {
  const p = String(password ?? '');

  const hasMinLength = p.length >= 8;
  const hasUppercase = /[A-Z]/.test(p);
  const hasLowercase = /[a-z]/.test(p);
  const hasNumber = /[0-9]/.test(p);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`^]/.test(p);

  const requirements: PasswordRequirement[] = [
    { id: 'min_length', label: 'At least 8 characters', met: hasMinLength },
    { id: 'uppercase', label: 'At least one uppercase letter (A-Z)', met: hasUppercase },
    { id: 'lowercase', label: 'At least one lowercase letter (a-z)', met: hasLowercase },
    { id: 'number', label: 'At least one number (0-9)', met: hasNumber },
    { id: 'special_char', label: 'At least one special character (!@#$%^&*)', met: hasSpecialChar },
  ];

  const errors = requirements.filter((r) => !r.met).map((r) => r.label);

  let score = 0;
  if (hasMinLength) score++;
  if (hasUppercase) score++;
  if (hasLowercase) score++;
  if (hasNumber) score++;
  if (hasSpecialChar) score++;

  const isValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;

  return {
    isValid,
    score,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar,
    requirements,
    errors,
  };
};

/**
 * Formats user-friendly error summary string for password validation failures.
 */
export const getPasswordRequirementsSummary = (result?: PasswordValidationResult): string => {
  if (!result || result.errors.length === 0) {
    return 'Password must be at least 8 characters long and include an uppercase letter, lowercase letter, number, and special character (!@#$%^&*).';
  }

  return `Password must include:\n• ${result.errors.join('\n• ')}`;
};
