import { Link, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/router/routes';
import { useAuthStore } from '@/stores/auth-store';

export function MarketingLayout() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-white/80 backdrop-blur dark:bg-zinc-950/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <Link to={ROUTES.home} className="font-semibold text-primary">
            MRD Online Clinic
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link className="text-muted-foreground hover:text-foreground" to={ROUTES.specialties}>
              Specialties
            </Link>
            <Link className="text-muted-foreground hover:text-foreground" to={ROUTES.findDoctor}>
              Find a doctor
            </Link>
            {user?.role === 'PATIENT' ? (
              <Button asChild size="sm">
                <Link to={ROUTES.patient.dashboard}>Patient hub</Link>
              </Button>
            ) : user?.role === 'PRACTITIONER' ? (
              <Button asChild size="sm">
                <Link to={ROUTES.practitioner.dashboard}>Practitioner hub</Link>
              </Button>
            ) : (
              <>
                <Link className="text-muted-foreground hover:text-foreground" to={ROUTES.login}>
                  Log in
                </Link>
                <Button asChild size="sm">
                  <Link to={ROUTES.register}>Sign up</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} MRD Online Clinic
      </footer>
    </div>
  );
}
