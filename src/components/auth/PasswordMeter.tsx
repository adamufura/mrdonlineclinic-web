import { cn } from '@/lib/utils/cn';

export function passwordStrengthScore(pw: string): number {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, s);
}

export function PasswordMeter({ password }: { password: string }) {
  const n = passwordStrengthScore(password);
  return (
    <div className="mt-1.5 flex gap-1">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className={cn('h-[3px] flex-1 rounded-sm bg-slate-200 transition-colors', i < n && 'bg-sky-500')} />
      ))}
    </div>
  );
}
