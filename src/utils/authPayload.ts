import { LoginRequest, RegisterRequest } from './types/api.types';

export const normalizeMobileNumber = (value: string | null | undefined) =>
  String(value ?? '').replace(/\D/g, '');

export const buildLoginPayload = (
  mobile: string | null | undefined,
  password: string | null | undefined,
): LoginRequest => ({
  mobile: normalizeMobileNumber(mobile),
  password: String(password ?? '').trim(),
});

export const buildRegisterPayload = (input: {
  name: string | null | undefined;
  mobile: string | null | undefined;
  password: string | null | undefined;
  confirmPassword: string | null | undefined;
  otp: string | null | undefined;
}): RegisterRequest => ({
  name: String(input.name ?? '').trim(),
  mobile: normalizeMobileNumber(input.mobile),
  password: String(input.password ?? '').trim(),
  confirmPassword: String(input.confirmPassword ?? '').trim(),
  otp: String(input.otp ?? '').trim(),
});
