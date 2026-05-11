import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

type AccountCreatingOverlayProps = {
  open: boolean;
  title?: string;
  subtitle?: string;
};

export function AccountCreatingOverlay({
  open,
  title = 'Creating your account',
  subtitle = 'Securely setting things up — this only takes a moment.',
}: AccountCreatingOverlayProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-busy="true"
      aria-labelledby="account-creating-title"
      aria-describedby="account-creating-desc"
    >
      <div className="w-full max-w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-slate-200/90 bg-white px-8 py-9 text-center shadow-2xl ring-1 ring-slate-900/5">
        <div className="mx-auto mb-5 flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-full bg-gradient-to-br from-sky-50 to-sky-100/80">
          <Loader2 className="size-8 animate-spin text-sky-600" strokeWidth={2} aria-hidden />
        </div>
        <p id="account-creating-title" className="font-display text-lg font-medium tracking-tight text-brand-navy">
          {title}
        </p>
        <p id="account-creating-desc" className="mt-2 text-[13px] leading-relaxed text-brand-body sm:text-sm">
          {subtitle}
        </p>
      </div>
    </div>,
    document.body,
  );
}
