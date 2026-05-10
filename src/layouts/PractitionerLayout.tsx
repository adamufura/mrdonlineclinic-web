import { useQuery } from '@tanstack/react-query';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { logout } from '@/features/auth/api';
import { getPractitionerMe } from '@/features/practitioners/session-api';
import { ROUTES } from '@/router/routes';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils/cn';

const nav = [
  { to: ROUTES.practitioner.dashboard, label: 'Dashboard' },
  { to: ROUTES.practitioner.schedule, label: 'Schedule' },
  { to: ROUTES.practitioner.appointments, label: 'Appointments' },
  { to: ROUTES.practitioner.availability, label: 'Availability' },
  { to: ROUTES.practitioner.patients, label: 'Patients' },
  { to: ROUTES.practitioner.messages, label: 'Messages' },
  { to: ROUTES.practitioner.prescriptions, label: 'Prescriptions' },
  { to: ROUTES.practitioner.profile, label: 'Profile' },
];

export function PractitionerLayout() {
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  const profile = useQuery({
    queryKey: ['practitioners', 'me'],
    queryFn: getPractitionerMe,
  });

  const status = typeof profile.data?.verificationStatus === 'string' ? profile.data.verificationStatus : undefined;
  const notes = typeof profile.data?.verificationNotes === 'string' ? profile.data.verificationNotes : undefined;

  async function onLogout() {
    await logout();
    clearSession();
    window.location.assign(ROUTES.login);
  }

  const showBanner = status && status !== 'VERIFIED';

  return (
    <div className="flex min-h-dvh flex-col">
      {showBanner ? (
        <div
          className={cn(
            'border-b px-4 py-2 text-center text-sm',
            status === 'REJECTED' && 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100',
            status === 'PENDING_REVIEW' &&
              'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100',
            (status === 'UNVERIFIED' || !status) &&
              'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100',
          )}
        >
          <strong className="font-semibold">{status?.replace('_', ' ')}</strong>
          {status === 'UNVERIFIED' ? (
            <span> — Complete your profile and submit credentials under Profile → Credentials.</span>
          ) : null}
          {status === 'PENDING_REVIEW' ? <span> — Your documents are being reviewed by an administrator.</span> : null}
          {status === 'REJECTED' && notes ? (
            <span>
              {' '}
              — Admin note: {notes}
            </span>
          ) : null}
          {profile.isLoading ? <span className="ml-2 text-xs opacity-80">(Loading verification state…)</span> : null}
        </div>
      ) : null}

      <div className="flex flex-1">
        <aside className="hidden w-56 shrink-0 border-r border-border bg-white p-4 dark:bg-zinc-950 lg:block">
          <div className="mb-8 font-semibold text-primary">Practitioner</div>
          <nav className="flex flex-col gap-1 text-sm">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn('rounded-md px-3 py-2 hover:bg-muted', isActive && 'bg-muted font-medium text-foreground')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center justify-between border-b border-border px-4 lg:px-6">
            <Link to={ROUTES.practitioner.dashboard} className="font-medium lg:hidden">
              Practitioner
            </Link>
            <div className="ml-auto flex items-center gap-2 text-sm">
              <span className="hidden text-muted-foreground sm:inline">{user?.email}</span>
              <Button variant="outline" size="sm" type="button" onClick={() => void onLogout()}>
                Log out
              </Button>
            </div>
          </header>
          <div className="flex-1 bg-muted/30 p-4 lg:p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
