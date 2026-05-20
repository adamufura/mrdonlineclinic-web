import { api, ensureAccessToken } from '@/lib/api/client';
import type { ApiEnvelope, AuthUser, TokenPair } from '@/types/api';
import type { AppLanguage } from '@/types/language';

function unwrap<T>(data: ApiEnvelope<T>, fallbackMsg: string): T {
  if (!data.success) {
    throw new Error(data.message || fallbackMsg);
  }
  if (data.data === undefined) {
    throw new Error(fallbackMsg);
  }
  return data.data;
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await api.get<ApiEnvelope<AuthUser>>('/auth/me');
  return unwrap(data, 'Unable to load profile');
}

export type LoginBody = { email: string; password: string };

export async function login(body: LoginBody): Promise<{ user: AuthUser; tokens: TokenPair }> {
  const { data } = await api.post<ApiEnvelope<{ user: AuthUser; tokens: TokenPair }>>('/auth/login', body);
  return unwrap(data, 'Login failed');
}

export async function logout(): Promise<void> {
  try {
    await api.post<ApiEnvelope>('/auth/logout', {}, { _skipAuthRefresh: true });
  } catch {
    /* still clear client session */
  }
}

export type RegisterPatientBody = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
};

export async function registerPatient(body: RegisterPatientBody): Promise<{ message: string }> {
  const { data } = await api.post<ApiEnvelope<{ message: string }>>('/auth/register/patient', body);
  return unwrap(data, 'Registration failed');
}

export type RegisterPractitionerBody = RegisterPatientBody & { specialties: string[] };

export async function registerPractitioner(body: RegisterPractitionerBody): Promise<{ message: string }> {
  const { data } = await api.post<ApiEnvelope<{ message: string }>>('/auth/register/practitioner', body);
  return unwrap(data, 'Registration failed');
}

export async function verifyEmail(token: string): Promise<{ message: string }> {
  const { data } = await api.post<ApiEnvelope<{ message: string }>>('/auth/verify-email', { token });
  return unwrap(data, 'Verification failed');
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const { data } = await api.post<ApiEnvelope<{ message: string }>>('/auth/forgot-password', { email });
  return unwrap(data, 'Request failed');
}

export async function resetPassword(token: string, password: string): Promise<{ message: string }> {
  const { data } = await api.post<ApiEnvelope<{ message: string }>>('/auth/reset-password', { token, password });
  return unwrap(data, 'Reset failed');
}

export async function updatePreferredLanguage(preferredLanguage: AppLanguage): Promise<AuthUser> {
  await ensureAccessToken();
  const { data } = await api.patch<ApiEnvelope<AuthUser>>('/auth/me/language', { preferredLanguage });
  return unwrap(data, 'Unable to update language');
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ message: string; tokens: TokenPair }> {
  await ensureAccessToken();
  const { data } = await api.post<ApiEnvelope<{ tokens: TokenPair }>>(
    '/auth/change-password',
    { currentPassword, newPassword },
    { _skipAuthRefresh: true },
  );
  const payload = unwrap(data, 'Password change failed');
  return { message: data.message ?? 'Password changed successfully', tokens: payload.tokens };
}
