import { useEffect } from 'react';
import { fetchMe } from '@/features/auth/api';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Hydrates the auth store from GET /auth/me (with refresh cookie + interceptor on 401).
 * Must render inside {@link RouterProvider} when navigation is needed; safe without for session-only bootstrap.
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
        const user = await fetchMe();
        if (!cancelled) {
          setUser(user);
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
