import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import {
  Award,
  Bell,
  Calendar,
  Clock,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  User,
  Users,
  X,
} from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { logout } from '@/features/auth/api';
import { PractitionerSlotManagerProvider, usePractitionerSlotManager } from '@/features/practitioners/practitioner-slot-manager';
import { getPractitionerMe, listPractitionerAppointments } from '@/features/practitioners/session-api';
import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/router/routes';
import { useAuthStore } from '@/stores/auth-store';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function BrandMark() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-gradient-to-br from-teal-300 to-sky-400 shadow-[0_6px_18px_rgba(56,189,248,0.4)]">
      <Plus className="h-4 w-4 text-white" strokeWidth={2.5} />
    </div>
  );
}

type NavIcon = typeof LayoutDashboard;

function NavRow({
  to,
  label,
  icon: Icon,
  onNavigate,
  end,
  badge,
  badgeMint,
  dot,
}: {
  to: string;
  label: string;
  icon: NavIcon;
  onNavigate?: () => void;
  end?: boolean;
  badge?: number;
  badgeMint?: boolean;
  dot?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'relative flex items-center gap-3 rounded-[9px] px-3 py-2.5 text-[13.5px] text-white/70 transition-colors hover:bg-white/5 hover:text-white',
          isActive &&
            'border border-teal-300/20 bg-teal-300/10 text-white before:absolute before:left-[-18px] before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-r before:bg-gradient-to-b before:from-teal-300 before:to-sky-400',
        )
      }
    >
      <Icon className="h-[18px] w-[18px] shrink-0 opacity-90" strokeWidth={2} />
      <span className="min-w-0 flex-1">{label}</span>
      {typeof badge === 'number' && badge > 0 ? (
        <span
          className={cn(
            'ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
            badgeMint ? 'bg-teal-300 text-[#04132a]' : 'bg-rose-500 text-white',
          )}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      ) : null}
      {dot ? <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-teal-300" /> : null}
    </NavLink>
  );
}

function SidebarNav({
  onNavigate,
  pendingAppointments,
}: {
  onNavigate?: () => void;
  pendingAppointments: number;
}) {
  const user = useAuthStore((s) => s.user);
  const publicProfileTo = user?.id ? ROUTES.findDoctorProfile(user.id) : ROUTES.practitioner.profile;

  return (
    <>
      <div className="px-2 pb-2">
        <div className="mb-2 px-2 pt-1 pb-4">
          <Link to={ROUTES.home} className="flex items-center gap-2.5" onClick={onNavigate}>
            <BrandMark />
            <span className="font-display text-[17px] font-medium tracking-tight text-white">
              MRD <span className="font-light text-white/65">Clinic</span>
            </span>
          </Link>
        </div>

        <p className="px-3 pb-1.5 pt-3 text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">Practice</p>
        <nav className="flex flex-col gap-0.5">
          <NavRow
            to={ROUTES.practitioner.dashboard}
            label="Dashboard"
            icon={LayoutDashboard}
            onNavigate={onNavigate}
            end
          />
          <NavRow
            to={ROUTES.practitioner.appointments}
            label="Appointments"
            icon={Calendar}
            onNavigate={onNavigate}
            badge={pendingAppointments}
          />
          <NavRow
            to={ROUTES.practitioner.availability}
            label="Availability"
            icon={Clock}
            onNavigate={onNavigate}
          />
          <NavRow to={ROUTES.practitioner.messages} label="Messages" icon={MessageSquare} onNavigate={onNavigate} />
          <NavRow to={ROUTES.practitioner.patients} label="Patients" icon={Users} onNavigate={onNavigate} />
        </nav>
      </div>

      <div className="px-2 pb-2">
        <p className="px-3 pb-1.5 pt-3 text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">Records</p>
        <nav className="flex flex-col gap-0.5">
          <NavRow
            to={ROUTES.practitioner.prescriptions}
            label="Prescriptions"
            icon={FileText}
            onNavigate={onNavigate}
          />
          <NavRow to={publicProfileTo} label="Reviews" icon={Award} onNavigate={onNavigate} dot />
          <NavRow
            to={ROUTES.practitioner.profileCredentials}
            label="Credentials"
            icon={ShieldCheck}
            onNavigate={onNavigate}
          />
        </nav>
      </div>

      <div className="px-2 pb-2">
        <p className="px-3 pb-1.5 pt-3 text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">Profile</p>
        <nav className="flex flex-col gap-0.5">
          <NavRow to={publicProfileTo} label="Public profile" icon={User} onNavigate={onNavigate} />
          <NavRow to={ROUTES.practitioner.profile} label="Settings" icon={Settings} onNavigate={onNavigate} />
        </nav>
      </div>
    </>
  );
}

function SidebarChrome({
  displayName,
  subtitle,
  initial,
  onRequestLogout,
}: {
  displayName: string;
  subtitle: string;
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
              <p className="truncate text-[13px] font-medium text-white">{displayName}</p>
              <p className="truncate text-[11px] text-white/55">{subtitle}</p>
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

const sidebarShell =
  'relative flex h-dvh w-[260px] shrink-0 flex-col gap-2 overflow-y-auto bg-gradient-to-b from-[#04132a] to-[#0a2545] px-[18px] pb-6 pt-6 before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_60%_30%_at_50%_0%,rgba(56,189,248,0.15),transparent_70%),radial-gradient(ellipse_50%_30%_at_50%_100%,rgba(94,234,212,0.1),transparent_70%)]';

function PractitionerLayoutInner() {
  const { openSlotManager } = usePractitionerSlotManager();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const profile = useQuery({
    queryKey: ['practitioners', 'me'],
    queryFn: getPractitionerMe,
  });

  const pendingCount = useQuery({
    queryKey: ['practitioners', 'me', 'appointments', 'layout-pending'],
    queryFn: () => listPractitionerAppointments({ page: 1, limit: 1, status: 'PENDING' }),
    select: (d) => d.meta.total ?? 0,
  });

  const status = typeof profile.data?.verificationStatus === 'string' ? profile.data.verificationStatus : undefined;
  const notes = typeof profile.data?.verificationNotes === 'string' ? profile.data.verificationNotes : undefined;
  const showBanner = Boolean(status && status !== 'VERIFIED');

  const specialtyLabel = (() => {
    const spec = profile.data?.specialties;
    if (!Array.isArray(spec) || spec.length === 0) return 'Practitioner';
    const s0 = spec[0];
    if (isRecord(s0) && typeof s0.name === 'string') return s0.name;
    return 'Practitioner';
  })();

  const displayName = user
    ? `Dr. ${[user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email}`
    : 'Practitioner';
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

  const pendingAppointments = pendingCount.data ?? 0;

  return (
    <div className="relative h-dvh overflow-hidden bg-[#f7f8fb] text-foreground">
      <aside className={cn(sidebarShell, 'fixed left-0 top-0 z-40 hidden lg:flex')}>
        <div className="relative z-[1] flex min-h-0 flex-1 flex-col gap-2">
          <SidebarNav pendingAppointments={pendingAppointments} />
          <SidebarChrome
            displayName={displayName}
            subtitle={specialtyLabel}
            initial={initial}
            onRequestLogout={() => setConfirmLogoutOpen(true)}
          />
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className={cn(sidebarShell, 'absolute left-0 top-0 flex h-full max-w-[85vw] shadow-2xl')}>
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
              <SidebarNav
                onNavigate={() => setMobileOpen(false)}
                pendingAppointments={pendingAppointments}
              />
              <SidebarChrome
                displayName={displayName}
                subtitle={specialtyLabel}
                initial={initial}
                onRequestLogout={() => setConfirmLogoutOpen(true)}
              />
            </div>
          </aside>
        </div>
      ) : null}

      <div className="flex h-dvh min-h-0 flex-col overflow-hidden lg:pl-[260px]">
        <header className="fixed left-0 right-0 top-0 z-30 flex h-[60px] items-center gap-4 border-b border-[#e2e8f0] bg-white/85 px-4 backdrop-blur-xl lg:left-[260px] lg:px-8">
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
              placeholder="Search patients, appointments, or notes…"
              className="h-9 border-[#e2e8f0] bg-[#eef1f6] pl-9 pr-14 text-[13px] shadow-none focus-visible:border-teal-500 focus-visible:bg-white focus-visible:ring-teal-500/20"
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
              type="button"
              onClick={openSlotManager}
              className="h-9 gap-1.5 rounded-[9px] bg-gradient-to-br from-teal-500 to-teal-700 px-3 text-[13px] font-medium text-white shadow-[0_4px_12px_rgba(20,184,166,0.25)] hover:from-teal-600 hover:to-teal-800 sm:px-4"
              title="Add visit availability"
            >
              <Plus className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
              <span className="hidden sm:inline">Create slot</span>
            </Button>
            <Link
              to={ROUTES.practitioner.profile}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-white bg-gradient-to-br from-teal-300 to-sky-400 font-display text-[13px] font-medium text-[#04132a] shadow-[0_0_0_1px_#e2e8f0]"
              title="Profile"
            >
              {initial}
            </Link>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pt-[60px] [-webkit-overflow-scrolling:touch]">
          <div className="mx-auto max-w-[1600px] px-4 py-6 lg:px-8 lg:py-7">
            {showBanner ? (
              <div
                className={cn(
                  'mb-6 flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
                  status === 'REJECTED' && 'border-red-200 bg-red-50 text-red-900',
                  status === 'PENDING_REVIEW' && 'border-amber-200 bg-amber-50 text-amber-900',
                  status !== 'REJECTED' &&
                    status !== 'PENDING_REVIEW' &&
                    'border-sky-200 bg-sky-50 text-sky-900',
                )}
              >
                <div className="flex min-w-0 gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                      status === 'REJECTED' && 'bg-red-100 text-red-800',
                      status === 'PENDING_REVIEW' && 'bg-amber-100 text-amber-800',
                      status !== 'REJECTED' && status !== 'PENDING_REVIEW' && 'bg-sky-100 text-sky-800',
                    )}
                  >
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 text-sm">
                    <p className="font-semibold">
                      {status === 'PENDING_REVIEW'
                        ? 'Credentials under review'
                        : status === 'REJECTED'
                          ? 'Credentials need attention'
                          : 'Complete your verification'}
                    </p>
                    <p className="mt-0.5 opacity-90">
                      {status === 'PENDING_REVIEW'
                        ? 'Most features stay available; patients see you on the directory once approved — usually within 24 hours.'
                        : null}
                      {status === 'REJECTED' && notes ? `Admin note: ${notes}` : null}
                      {status === 'REJECTED' && !notes ? 'Please update your documents and resubmit.' : null}
                      {status !== 'PENDING_REVIEW' && status !== 'REJECTED'
                        ? 'Submit your license under Profile → Credentials so administrators can verify your practice.'
                        : null}
                      {profile.isLoading ? <span className="ml-1 text-xs opacity-80">Loading…</span> : null}
                    </p>
                  </div>
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="shrink-0 bg-white/80 hover:bg-white"
                >
                  <Link to={ROUTES.practitioner.profileCredentials}>Track status</Link>
                </Button>
              </div>
            ) : null}
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

export function PractitionerLayout() {
  return (
    <PractitionerSlotManagerProvider>
      <PractitionerLayoutInner />
    </PractitionerSlotManagerProvider>
  );
}
