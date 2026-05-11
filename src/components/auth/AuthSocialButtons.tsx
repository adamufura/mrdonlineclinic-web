import type { ReactNode } from 'react';
import { toast } from 'sonner';

function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9c-.3 1.4-1 2.5-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.9 0 5.4-1 7.2-2.6l-3.5-2.7c-1 .6-2.2 1-3.7 1-2.8 0-5.2-1.9-6.1-4.5H2.3v2.8C4.1 20.6 7.8 23 12 23z"
      />
      <path fill="#FBBC05" d="M5.9 14.2c-.2-.6-.4-1.4-.4-2.2s.1-1.5.4-2.2V7H2.3C1.5 8.5 1 10.2 1 12s.5 3.5 1.3 5l3.6-2.8z" />
      <path
        fill="#EA4335"
        d="M12 5.4c1.6 0 3 .5 4.1 1.6l3.1-3.1C17.4 2.1 14.9 1 12 1 7.8 1 4.1 3.4 2.3 7l3.6 2.8c.9-2.6 3.3-4.4 6.1-4.4z"
      />
    </svg>
  );
}

function AppleGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M17.05 12.04c-.03-2.92 2.39-4.33 2.5-4.4-1.36-2-3.49-2.27-4.24-2.3-1.81-.18-3.53 1.07-4.45 1.07-.93 0-2.34-1.04-3.85-1.01-1.98.03-3.81 1.15-4.83 2.92-2.06 3.57-.53 8.85 1.48 11.75.98 1.42 2.15 3.02 3.68 2.96 1.48-.06 2.04-.96 3.83-.96 1.79 0 2.29.96 3.85.93 1.59-.03 2.6-1.45 3.57-2.88 1.13-1.65 1.59-3.25 1.62-3.33-.04-.02-3.11-1.19-3.16-4.75zM14.13 3.91c.82-.99 1.36-2.36 1.22-3.73-1.18.05-2.6.79-3.44 1.77-.76.87-1.42 2.27-1.24 3.61 1.31.1 2.65-.66 3.46-1.65z"
      />
    </svg>
  );
}

function SocialButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 items-center justify-center gap-2.5 rounded-full border border-slate-200/80 bg-white px-4 text-[14px] font-semibold text-slate-800 shadow-[0_1px_3px_rgba(15,23,42,0.08)] transition hover:border-slate-300 hover:bg-slate-50 hover:shadow-[0_2px_8px_rgba(15,23,42,0.1)]"
    >
      <span className="flex size-5 shrink-0 items-center justify-center [&_svg]:size-5">{icon}</span>
      {label}
    </button>
  );
}

export function AuthSocialButtons() {
  const soon = () => toast.info('Social sign-in is not wired yet — use email for now.');

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <SocialButton label="Google" icon={<GoogleGlyph />} onClick={soon} />
      <SocialButton label="Apple" icon={<AppleGlyph className="text-slate-900" />} onClick={soon} />
    </div>
  );
}
