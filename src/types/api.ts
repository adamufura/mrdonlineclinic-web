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
  lastLoginAt?: string;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};
