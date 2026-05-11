import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  Bell,
  Calendar,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Stethoscope,
  User,
  X,
} from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { logout } from '@/features/auth/api';
import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/router/routes';
import { useAuthStore } from '@/stores/auth-store';

const workspaceNav = [
  { to: ROUTES.patient.dashboard, label: 'Dashboard', icon: LayoutDashboard },
  { to: ROUTES.patient.appointments, label: 'Appointments', icon: Calendar },
  { to: ROUTES.patient.messages, label: 'Messages', icon: MessageSquare },
  { to: ROUTES.patient.prescriptions, label: 'Prescriptions', icon: FileText },
  { to: ROUTES.findDoctor, label: 'Find a doctor', icon: Stethoscope },
] as const;

const careNav = [
  { to: ROUTES.patient.profile, label: 'Health profile', icon: User },
  { to: ROUTES.patient.profileMedical, label: 'Vitals & trends', icon: Activity },
  { to: ROUTES.patient.profile, label: 'Settings', icon: Settings },
] as const;

function BrandMark() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-gradient-to-br from-teal-300 to-sky-400 shadow-[0_6px_18px_rgba(56,189,248,0.4)]">
      <Plus className="h-4 w-4 text-white" strokeWidth={2.5} />
    </div>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'relative flex items-center gap-3 rounded-[9px] px-3 py-2.5 text-[13.5px] text-white/70 transition-colors hover:bg-white/5 hover:text-white',
      isActive &&
        'border border-teal-300/20 bg-teal-300/10 text-white before:absolute before:left-[-18px] before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-r before:bg-gradient-to-b before:from-teal-300 before:to-sky-400',
    );

  return (
    <>
      <div className="px-2 pb-2">
        <div className="mb-2 px-2 pt-1 pb-4">
          <Link
            to={ROUTES.home}
            className="flex items-center gap-2.5"
            onClick={onNavigate}
          >
            <BrandMark />
            <span className="font-display text-[17px] font-medium tracking-tight text-white">
              MRD <span className="font-light text-white/65">Clinic</span>
            </span>
          </Link>
        </div>

        <p className="px-3 pb-1.5 pt-3 text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">Workspace</p>
        <nav className="flex flex-col gap-0.5">
          {workspaceNav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkClass} onClick={onNavigate} end={to === ROUTES.patient.dashboard}>
              <Icon className="h-[18px] w-[18px] shrink-0 opacity-90" strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="px-2 pb-2">
        <p className="px-3 pb-1.5 pt-3 text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">Care</p>
        <nav className="flex flex-col gap-0.5">
          {careNav.map(({ to, label, icon: Icon }) => (
            <NavLink key={`${to}-${label}`} to={to} className={linkClass} onClick={onNavigate}>
              <Icon className="h-[18px] w-[18px] shrink-0 opacity-90" strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
}

function SidebarChrome({
  userName,
  userRole,
  initial,
  onRequestLogout,
}: {
  userName: string;
  userRole: string;
  initial: string;
  onRequestLogout: () => void;
}) {
  return (
    <div className="mt-auto rounded-xl border border-white/[0.06] bg-white/[0.04] p-3">
      <div className="flex gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-300 to-sky-400 font-display text-[13px] font-medium text-[#04132a]">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-white">{userName}</p>
              <p className="text-[11px] text-white/55">{userRole}</p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-md p-1 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
              title="More"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
          <Button
            variant="ghost"
            type="button"
            className="mt-2 h-8 w-full justify-center rounded-lg border border-white/10 bg-white/[0.04] text-[12px] font-medium text-white/85 hover:bg-white/10 hover:text-white"
            onClick={onRequestLogout}
          >
            Log out
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PatientLayout() {
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Patient';
  const initial = (user?.firstName?.[0] ?? user?.email?.[0] ?? 'P').toUpperCase();

  async function performLogout() {
    await logout();
    clearSession();
    window.location.assign(ROUTES.login);
  }

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const sidebarClass =
    'relative flex h-dvh w-[260px] shrink-0 flex-col gap-2 overflow-y-auto bg-gradient-to-b from-[#04132a] to-[#0a2545] px-[18px] pb-6 pt-6 before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_60%_30%_at_50%_0%,rgba(56,189,248,0.15),transparent_70%),radial-gradient(ellipse_50%_30%_at_50%_100%,rgba(94,234,212,0.1),transparent_70%)]';

  return (
    <div className="relative h-dvh overflow-hidden bg-[#f7f8fb] text-foreground">
      {/* Desktop sidebar — fixed */}
      <aside className={cn(sidebarClass, 'fixed left-0 top-0 z-40 hidden lg:flex')}>
        <div className="relative z-[1] flex min-h-0 flex-1 flex-col gap-2">
          <SidebarNav />
          <SidebarChrome
            userName={displayName}
            userRole="Patient"
            initial={initial}
            onRequestLogout={() => setConfirmLogoutOpen(true)}
          />
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className={cn(sidebarClass, 'absolute left-0 top-0 flex h-full max-w-[85vw] shadow-2xl')}>
            <div className="relative z-[1] flex min-h-0 flex-1 flex-col gap-2">
              <div className="flex justify-end px-1">
                <button
                  type="button"
                  className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
              <SidebarChrome
                userName={displayName}
                userRole="Patient"
                initial={initial}
                onRequestLogout={() => setConfirmLogoutOpen(true)}
              />
            </div>
          </aside>
        </div>
      ) : null}

      {/* Main column: fixed viewport height so only <main> scrolls */}
      <div className="flex h-dvh min-h-0 flex-col overflow-hidden lg:pl-[260px]">
        <header
          className="fixed left-0 right-0 top-0 z-30 flex h-[60px] items-center gap-4 border-b border-[#e2e8f0] bg-white/85 px-4 backdrop-blur-xl lg:left-[260px] lg:px-8"
        >
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 lg:hidden"
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="relative min-w-0 flex-1 max-lg:max-w-none lg:max-w-[460px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              type="search"
              placeholder="Search doctors, prescriptions, or messages…"
              className="h-9 border-[#e2e8f0] bg-[#eef1f6] pl-9 pr-14 text-[13px] shadow-none focus-visible:border-sky-500 focus-visible:bg-white focus-visible:ring-sky-500/20"
            />
            <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-[#e2e8f0] bg-white px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
              ⌘K
            </kbd>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              className="relative grid h-9 w-9 place-items-center rounded-[9px] text-muted-foreground transition-colors hover:bg-[#eef1f6] hover:text-foreground"
              title="Notifications"
            >
              <Bell className="h-[17px] w-[17px]" strokeWidth={2} />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full border-2 border-white bg-rose-500" />
            </button>
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-[9px] text-muted-foreground transition-colors hover:bg-[#eef1f6] hover:text-foreground"
              title="Help"
            >
              <HelpCircle className="h-[17px] w-[17px]" strokeWidth={2} />
            </button>
            <Button
              asChild
              className="hidden h-9 gap-1.5 rounded-[9px] bg-gradient-to-br from-sky-500 to-sky-700 px-4 text-[13px] font-medium text-white shadow-[0_4px_12px_rgba(14,165,233,0.25)] hover:from-sky-600 hover:to-sky-800 sm:inline-flex"
            >
              <Link to={ROUTES.findDoctor}>
                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                Book a visit
              </Link>
            </Button>
            <Link
              to={ROUTES.patient.profile}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-white bg-gradient-to-br from-violet-300 to-violet-600 font-display text-[13px] font-medium text-white shadow-[0_0_0_1px_#e2e8f0]"
              title="Profile"
            >
              {initial}
            </Link>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pt-[60px] [-webkit-overflow-scrolling:touch]">
          <div className="mx-auto max-w-[1600px] px-4 py-6 lg:px-8 lg:py-7">
            <Outlet />
          </div>
        </main>
      </div>

      <ConfirmDialog
        open={confirmLogoutOpen}
        onOpenChange={setConfirmLogoutOpen}
        title="Log out of MRD Clinic?"
        description="You will be signed out on this device. You can sign back in anytime."
        confirmLabel="Log out"
        cancelLabel="Stay signed in"
        variant="destructive"
        onConfirm={performLogout}
      />
    </div>
  );
}
