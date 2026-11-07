import { LoginRequest, RegisterRequest } from './types/api.types';

export const normalizeIdentifier = (value: string | null | undefined): string => {
  const str = String(value ?? '').trim();
  if (str.includes('@')) {
    return str.toLowerCase();
  }
  return str.replace(/\D/g, '');
};

export const normalizeMobileNumber = (value: string | null | undefined): string => {
  return normalizeIdentifier(value);
};

export const generateDeterministicMobile = (email: string | null | undefined): string => {
  const clean = String(email ?? '').toLowerCase().trim();
  if (!clean) return '9999999999';

  let hash = 5381;
  for (let i = 0; i < clean.length; i++) {
    hash = ((hash << 5) + hash) + clean.charCodeAt(i);
    hash = hash & hash;
  }
  const positive = Math.abs(hash);
  const numStr = String(positive).padStart(9, '0').slice(-9);
  return `9${numStr}`;
};

export const buildLoginPayload = (
  identifier: string | null | undefined,
  password: string | null | undefined,
): LoginRequest => {
  const clean = normalizeIdentifier(identifier);
  const isEmail = clean.includes('@');
  return {
    email: isEmail ? clean : (clean ? `${clean}@amara.com` : ''),
    ...(isEmail ? {} : { mobile: clean }),
    password: String(password ?? '').trim(),
  } as LoginRequest;
};

export const buildRegisterPayload = (input: {
  name: string | null | undefined;
  mobile?: string | null | undefined;
  email?: string | null | undefined;
  password: string | null | undefined;
  confirmPassword: string | null | undefined;
  otp: string | null | undefined;
}): RegisterRequest => {
  const rawEmail = input.email ? String(input.email).trim() : '';
  const rawMobile = input.mobile ? String(input.mobile).trim() : '';
  const cleanEmail = rawEmail.includes('@')
    ? rawEmail.toLowerCase()
    : rawMobile.includes('@')
    ? rawMobile.toLowerCase()
    : undefined;
  const cleanMobile =
    rawMobile && !rawMobile.includes('@')
      ? normalizeIdentifier(rawMobile)
      : undefined;

  return {
    name: String(input.name ?? '').trim(),
    email: cleanEmail,
    mobile: cleanMobile,
    password: String(input.password ?? '').trim(),
    confirmPassword: String(input.confirmPassword ?? '').trim(),
    otp: String(input.otp ?? '').trim(),
  } as RegisterRequest;
};
