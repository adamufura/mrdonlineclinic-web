import { useEffect } from 'react';
import { ensureAccessToken } from '@/lib/api/client';
import { fetchMe } from '@/features/auth/api';
import { setAppLanguage } from '@/i18n';
import type { AppLanguage } from '@/types/language';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Hydrates session: refresh cookie → access token, then GET /auth/me.
 * Refresh token stays in httpOnly cookie; access token in memory + sessionStorage.
 */
export function AuthBootstrap() {
  const setBootstrapStatus = useAuthStore((s) => s.setBootstrapStatus);
  const setUser = useAuthStore((s) => s.setUser);
  const clearSession = useAuthStore((s) => s.clearSession);

  useEffect(() => {
    let cancelled = false;
    setBootstrapStatus('loading');
    void (async () => {
      try {
        const token = await ensureAccessToken();
        if (!token) {
          if (!cancelled) {
            clearSession();
            setBootstrapStatus('ready');
          }
          return;
        }
        const user = await fetchMe();
        if (!cancelled) {
          setUser(user);
          const lang = (user.preferredLanguage === 'ha' ? 'ha' : 'en') as AppLanguage;
          await setAppLanguage(lang);
          setBootstrapStatus('ready');
        }
      } catch {
        if (!cancelled) {
          clearSession();
          setUser(null);
          setBootstrapStatus('ready');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clearSession, setBootstrapStatus, setUser]);

  return null;
}
