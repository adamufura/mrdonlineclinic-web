export type ApiMeta = {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};

export type ApiEnvelope<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
  meta?: ApiMeta;
};

import type { AppLanguage } from './language';

export type AuthRole = 'PATIENT' | 'PRACTITIONER' | 'ADMIN';

export type AuthUser = {
  id: string;
  role: AuthRole;
  adminRole?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  status: string;
  isEmailVerified: boolean;
  preferredLanguage?: AppLanguage;
  lastLoginAt?: string;
  profilePhotoUrl?: string;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};
