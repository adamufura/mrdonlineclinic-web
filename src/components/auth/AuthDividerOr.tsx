export function AuthDividerOr({ label = 'Or continue with' }: { label?: string }) {
  return (
    <div className="my-6 flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
      <span className="h-px flex-1 bg-slate-200" />
      {label}
      <span className="h-px flex-1 bg-slate-200" />
    </div>
  );
}
