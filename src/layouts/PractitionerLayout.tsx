import { Link, NavLink, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { logout } from '@/features/auth/api';
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

  async function onLogout() {
    await logout();
    clearSession();
    window.location.assign(ROUTES.login);
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
        Verification status will appear here (UNVERIFIED / PENDING_REVIEW / VERIFIED). Action buttons stay disabled until
        verified — wiring comes next.
      </div>
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
