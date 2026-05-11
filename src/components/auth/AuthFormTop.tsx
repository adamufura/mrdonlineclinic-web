import { ArrowLeft, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ROUTES } from '@/router/routes';

export function AuthFormTop() {
  return (
    <div className="mb-2 flex items-center justify-between gap-4">
      <Link
        to={ROUTES.home}
        className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-500 transition-colors hover:text-brand-navy"
      >
        <ArrowLeft className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
        Back to home
      </Link>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          onClick={() => toast.info('More languages coming soon.')}
        >
          <Globe className="size-3.5" aria-hidden />
          EN
        </button>
      </div>
    </div>
  );
}
