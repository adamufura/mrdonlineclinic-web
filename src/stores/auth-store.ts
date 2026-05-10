import { create } from 'zustand';
import type { AuthUser } from '@/types/api';

export type AuthBootstrapStatus = 'idle' | 'loading' | 'ready';

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
  bootstrapStatus: AuthBootstrapStatus;
  setAccessToken: (token: string | null) => void;
  setUser: (user: AuthUser | null) => void;
  setSession: (user: AuthUser, accessToken: string) => void;
  clearSession: () => void;
  setBootstrapStatus: (s: AuthBootstrapStatus) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  bootstrapStatus: 'idle',
  setAccessToken: (accessToken) => set({ accessToken }),
  setUser: (user) => set({ user }),
  setSession: (user, accessToken) => set({ user, accessToken }),
  clearSession: () => set({ accessToken: null, user: null }),
  setBootstrapStatus: (bootstrapStatus) => set({ bootstrapStatus }),
}));
