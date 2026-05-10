import { Link, NavLink, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/router/routes';
import { logout } from '@/features/auth/api';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils/cn';

const nav = [
  { to: ROUTES.patient.dashboard, label: 'Dashboard' },
  { to: ROUTES.patient.appointments, label: 'Appointments' },
  { to: ROUTES.patient.messages, label: 'Messages' },
  { to: ROUTES.patient.prescriptions, label: 'Prescriptions' },
  { to: ROUTES.findDoctor, label: 'Find a doctor' },
  { to: ROUTES.patient.profile, label: 'Profile' },
  { to: ROUTES.patient.profileMedical, label: 'Medical info' },
];

export function PatientLayout() {
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  async function onLogout() {
    await logout();
    clearSession();
    window.location.assign(ROUTES.login);
  }

  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-56 shrink-0 border-r border-border bg-white p-4 dark:bg-zinc-950 lg:block">
        <div className="mb-8 font-semibold text-primary">Patient</div>
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
          <Link to={ROUTES.patient.dashboard} className="font-medium lg:hidden">
            Patient
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
  );
}
