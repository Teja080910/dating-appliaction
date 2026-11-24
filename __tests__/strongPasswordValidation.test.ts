import {
  validateStrongPassword,
  getPasswordRequirementsSummary,
} from '../src/utils/passwordValidation';
import apiClient from '../src/api/apiClient';

describe('Strong Password Validation Suite', () => {
  describe('Rule-by-rule Unit Checks', () => {
    test('rejects passwords shorter than 8 characters', () => {
      const res = validateStrongPassword('Pass1!');
      expect(res.isValid).toBe(false);
      expect(res.hasMinLength).toBe(false);
      expect(res.errors).toContain('At least 8 characters');
    });

    test('rejects passwords without an uppercase letter', () => {
      const res = validateStrongPassword('password123!');
      expect(res.isValid).toBe(false);
      expect(res.hasUppercase).toBe(false);
      expect(res.errors).toContain('At least one uppercase letter (A-Z)');
    });

    test('rejects passwords without a lowercase letter', () => {
      const res = validateStrongPassword('PASSWORD123!');
      expect(res.isValid).toBe(false);
      expect(res.hasLowercase).toBe(false);
      expect(res.errors).toContain('At least one lowercase letter (a-z)');
    });

    test('rejects passwords without a number', () => {
      const res = validateStrongPassword('Password!@#');
      expect(res.isValid).toBe(false);
      expect(res.hasNumber).toBe(false);
      expect(res.errors).toContain('At least one number (0-9)');
    });

    test('rejects passwords without a special character', () => {
      const res = validateStrongPassword('Password123');
      expect(res.isValid).toBe(false);
      expect(res.hasSpecialChar).toBe(false);
      expect(res.errors).toContain('At least one special character (!@#$%^&*)');
    });

    test('accepts strong passwords meeting all requirements', () => {
      const validPasswords = [
        'Password@123',
        'Amara#2026Secure',
        'Welcome!2024',
        'Strong_Pass9',
        'L0ve&Match99',
      ];

      for (const pwd of validPasswords) {
        const res = validateStrongPassword(pwd);
        expect(res.isValid).toBe(true);
        expect(res.score).toBe(5);
        expect(res.errors).toHaveLength(0);
      }
    });

    test('formats requirements summary correctly for missing requirements', () => {
      const res = validateStrongPassword('abc');
      const summary = getPasswordRequirementsSummary(res);
      expect(summary).toContain('Password must include:');
      expect(summary).toContain('At least 8 characters');
      expect(summary).toContain('At least one uppercase letter');
    });
  });

  describe('API and Mock Adapter Enforcement', () => {
    test('POST /register rejects weak password with 400 Bad Request', async () => {
      await expect(
        apiClient.post('/register', {
          email: 'newuser_pwd_test@example.com',
          name: 'Test User',
          password: 'weak',
          confirmPassword: 'weak',
        })
      ).rejects.toThrow();
    });

    test('POST /register accepts strong password meeting requirements', async () => {
      const res = await apiClient.post('/register', {
        email: 'strong_pwd_user@example.com',
        name: 'Strong User',
        password: 'Password@123',
        confirmPassword: 'Password@123',
      });
      expect(res.status).toBe(200);
      expect(res.data.status).toBe('success');
    });

    test('POST /forgot-password/reset rejects weak new password', async () => {
      // First get an OTP
      await apiClient.post('/forgot-password/send-otp', { email: 'strong_pwd_user@example.com' });

      await expect(
        apiClient.post('/forgot-password/reset', {
          email: 'strong_pwd_user@example.com',
          otp: '123456',
          newPassword: '123',
        })
      ).rejects.toThrow();
    });

    test('POST /forgot-password/reset accepts strong new password', async () => {
      const res = await apiClient.post('/forgot-password/reset', {
        email: 'strong_pwd_user@example.com',
        otp: '123456',
        newPassword: 'NewPassword@2026',
      });
      expect(res.status).toBe(200);
      expect(res.data.status).toBe('success');
    });
  });
});
