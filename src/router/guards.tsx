import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AppSplash } from '@/components/shared/app-splash';
import { ROUTES } from '@/router/routes';
import { useAuthStore } from '@/stores/auth-store';
import type { AuthRole } from '@/types/api';

function dashboardForRole(role: AuthRole): string {
  if (role === 'PATIENT') return ROUTES.patient.dashboard;
  if (role === 'PRACTITIONER') return ROUTES.practitioner.dashboard;
  return ROUTES.home;
}

export function RequireGuest({ children }: { children?: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const bootstrapStatus = useAuthStore((s) => s.bootstrapStatus);

  if (bootstrapStatus !== 'ready') {
    return <AppSplash />;
  }
  if (user) {
    return <Navigate to={dashboardForRole(user.role)} replace />;
  }
  return children ? <>{children}</> : <Outlet />;
}

export function RequireAuth({ children }: { children?: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const bootstrapStatus = useAuthStore((s) => s.bootstrapStatus);
  const location = useLocation();

  if (bootstrapStatus !== 'ready') {
    return <AppSplash />;
  }
  if (!user) {
    const returnUrl = `${location.pathname}${location.search}`;
    const qs = new URLSearchParams({ returnUrl });
    return <Navigate to={`${ROUTES.login}?${qs.toString()}`} replace />;
  }
  return children ? <>{children}</> : <Outlet />;
}

export function RequireRole({ role, children }: { role: Exclude<AuthRole, 'ADMIN'>; children?: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const bootstrapStatus = useAuthStore((s) => s.bootstrapStatus);

  if (bootstrapStatus !== 'ready') {
    return <AppSplash />;
  }
  if (!user) {
    return <Navigate to={ROUTES.login} replace />;
  }
  if (user.role !== role) {
    return <Navigate to={dashboardForRole(user.role)} replace />;
  }
  return children ? <>{children}</> : <Outlet />;
}
