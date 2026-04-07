import { useMutation } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './apiClient';
import { clearFullSession, hasSessionToken, saveAuthSession } from '../utils/session';
import { LoginRequest, RegisterRequest } from '../utils/types/api.types';

type VerifyRegisterOtpRequest = {
  mobile: string;
  otp: string;
  sessionId: string;
};

type InitRegisterRequest = Omit<RegisterRequest, 'otp'> & {
  otp?: string;
};
type CompleteRegisterRequest = RegisterRequest & {
  sessionId?: string;
};
type VerifyOtpRequest = {
  userId?: number | string;
  mobile: string;
  otp: string;
};
type SendOtpRequest = {
  mobile: string;
  otp?: string;
};
type ForgotPasswordSendOtpRequest = {
  mobile: string;
};
type ForgotPasswordResetRequest = {
  mobile: string;
  otp: string;
  newPassword: string;
};

const normalizePlainApiResponse = (payload: unknown) => {
  if (typeof payload === 'string') {
    return payload.trim();
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    return (
      (typeof record.message === 'string' && record.message.trim()) ||
      (typeof record.data === 'string' && record.data.trim()) ||
      record
    );
  }

  return '';
};

const normalizeAuthPayload = (data: any) => {
  if (Array.isArray(data)) {
    return data[0] ?? {};
  }

  if (data && typeof data === 'object') {
    return data;
  }

  if (typeof data === 'string') {
    return { message: data };
  }

  return {};
};

const normalizeAuthResponse = (data: any, headers?: any) => {
  const payload = normalizeAuthPayload(data);
  const nestedData =
    payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)
      ? payload.data
      : null;

  return {
    ...payload,
    ...(nestedData || {}),
    ...(headers ? { __headers: headers } : {}),
    message:
      payload?.message ||
      nestedData?.message ||
      (typeof data === 'string' ? data : undefined),
    sessionId:
      payload?.sessionId ||
      nestedData?.sessionId ||
      payload?.verificationSessionId ||
      nestedData?.verificationSessionId ||
      null,
  };
};

export const useAuth = () => {
  const persistSessionIfAvailable = async (data: any) => {
    // 🔍 DEBUG: Log the FULL response from login/register to understand its structure
    if (__DEV__) {
      console.log('🔍 [AUTH] Raw response from server:', JSON.stringify(data, null, 2));
    }

    if (hasSessionToken(data)) {
      const session = await saveAuthSession(data);

      if (__DEV__) {
        console.log('🔍 [AUTH] Extracted session:', {
          hasToken: Boolean(session?.token),
          userId: session?.userId,
          userKeys: session?.user ? Object.keys(session.user) : 'null',
          rawKeys: session?.raw ? Object.keys(session.raw) : 'null',
        });
      }

      return {
        ...(data || {}),
        ...(session?.token ? { token: session.token } : {}),
        ...(session?.userId ? { userId: session.userId } : {}),
        ...(session?.user ? { user: session.user } : {}),
      };
    }
    return data;
  };

  // 🔹 SEND OTP FOR REGISTRATION
  const sendRegisterOtp = useMutation({
    mutationFn: async (data: InitRegisterRequest) => {
      const payload = {
        ...data,
        otp: String(data.otp ?? '').trim(),
      };
      const res = await apiClient.post('/register', payload);
      return persistSessionIfAvailable(normalizeAuthResponse(res.data, res.headers));
    },
  });

  // 🔹 FINAL REGISTER
  const register = useMutation({
    mutationFn: async (data: CompleteRegisterRequest) => {
      const res = await apiClient.post('/register', data);
      return persistSessionIfAvailable(normalizeAuthResponse(res.data, res.headers));
    },
  });

  // 🔹 LOGIN
  const login = useMutation({
    mutationFn: async (data: LoginRequest) => {
      const res = await apiClient.post('/login', data);
      const normalizedResponse = normalizeAuthResponse(res.data, res.headers);
      const persisted = await persistSessionIfAvailable(normalizedResponse);

      if (persisted?.token) {
        await AsyncStorage.multiSet([
          ['userToken', persisted.token],
          ['userMobile', String(data?.mobile ?? '').trim()],
        ]);
      }

      return {
        ...persisted,
        identityPending: !persisted?.userId,
      };
    },
  });

  // 🔹 VERIFY REGISTER OTP (Legacy alias or if needed)
  const verifyRegisterOtp = useMutation({
    mutationFn: async (data: VerifyRegisterOtpRequest) => {
      const payload = {
        mobile: data.mobile,
        otp: data.otp,
        ...(String(data.sessionId ?? '').trim() ? { sessionId: String(data.sessionId).trim() } : {}),
      };
      const res = await apiClient.post('/verify-register/otp', payload);
      return persistSessionIfAvailable(normalizeAuthResponse(res.data, res.headers));
    },
  });


  // 🔹 SEND OTP (Generic)
  const sendOtp = useMutation({
    mutationFn: async (data: SendOtpRequest) => {
      const res = await apiClient.post('/auth/send-otp', data);
      return res.data;
    },
  });

  // 🔹 VERIFY OTP (Generic)
  const verifyOtp = useMutation({
    mutationFn: async (data: VerifyOtpRequest) => {
      const payload = {
        mobile: String(data.mobile ?? '').trim(),
        otp: String(data.otp ?? '').trim(),
        ...(data.userId === '' || data.userId == null
          ? {}
          : { userId: Number.isFinite(Number(data.userId)) ? Number(data.userId) : data.userId }),
      };

      if (!payload.mobile || !payload.otp) {
        throw new Error('Mobile and OTP are required');
      }

      const res = await apiClient.post('/auth/verify-otp', payload);
      return persistSessionIfAvailable(normalizeAuthResponse(res.data, res.headers));
    },
  });

  // 🔹 FORGOT PASSWORD - SEND OTP
  const forgotPasswordSendOtp = useMutation({
    mutationFn: async (data: ForgotPasswordSendOtpRequest) => {
      const payload = {
        mobile: String(data.mobile ?? '').trim(),
      };
      if (!payload.mobile) {
        throw new Error('Mobile is required');
      }

      const res = await apiClient.post('/forgot-password/send-otp', payload);
      return normalizePlainApiResponse(res.data);
    },
  });

  // 🔹 FORGOT PASSWORD - RESET
  const forgotPasswordReset = useMutation({
    mutationFn: async (data: ForgotPasswordResetRequest) => {
      const payload = {
        mobile: String(data.mobile ?? '').trim(),
        otp: String(data.otp ?? '').trim(),
        newPassword: String(data.newPassword ?? '').trim(),
      };

      if (!payload.mobile || !payload.otp || !payload.newPassword) {
        throw new Error('Mobile, OTP, and new password are required');
      }

      const res = await apiClient.post('/forgot-password/reset', payload);
      return normalizePlainApiResponse(res.data);
    },
  });

  // 🔹 CHANGE PASSWORD
  const changePassword = useMutation({
    mutationFn: async ({ userId, oldPassword, newPassword }: any) => {
      void userId;

      const normalizedOldPassword = String(oldPassword ?? '').trim();
      const normalizedNewPassword = String(newPassword ?? '').trim();
      if (!normalizedOldPassword || !normalizedNewPassword) {
        throw new Error('Old and new password are required');
      }

      const res = await apiClient.post(
        '/setting/change-password',
        null,
        {
          params: {
            oldPassword: normalizedOldPassword,
            newPassword: normalizedNewPassword,
          },
        }
      );
      return normalizePlainApiResponse(res.data);
    },
  });

  // 🔹 DEACTIVATE ACCOUNT (API + logout)
  const deactivateAccount = useMutation({
    mutationFn: async (userId: any) => {
      void userId;

      const res = await apiClient.post('/account/deactivate');
      return normalizePlainApiResponse(res.data);
    },
    onSuccess: async () => {
      await clearFullSession();
    },
  });

  // 🔹 DELETE ACCOUNT
  const deleteAccount = useMutation({
    mutationFn: async (userId: any) => {
      void userId;

      const res = await apiClient.delete('/account/delete');
      return normalizePlainApiResponse(res.data);
    },
    onSuccess: async () => {
      await clearFullSession();
    },
  });

  // 🔹 LOGOUT (ONLY LOCAL)
  const logout = async () => {
    await clearFullSession();
  };

  return {
    register,
    login,
    sendRegisterOtp,
    verifyRegisterOtp,
    sendOtp,
    verifyOtp,
    resendOtp: sendRegisterOtp,

    forgotPasswordSendOtp,
    forgotPasswordReset,

    changePassword,
    deactivateAccount,
    deleteAccount,

    logout,
  };
};
