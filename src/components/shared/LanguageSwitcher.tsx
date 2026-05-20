import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updatePreferredLanguage } from '@/features/auth/api';
import { setAppLanguage } from '@/i18n';
import { cn } from '@/lib/utils/cn';
import type { AppLanguage } from '@/types/language';
import { useAuthStore } from '@/stores/auth-store';

type Props = {
  className?: string;
  compact?: boolean;
};

export function LanguageSwitcher({ className, compact }: Props) {
  const { i18n, t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const current = (i18n.language === 'ha' ? 'ha' : 'en') as AppLanguage;
  const next: AppLanguage = current === 'en' ? 'ha' : 'en';

  const mutation = useMutation({
    mutationFn: updatePreferredLanguage,
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
    },
    onError: () => {
      toast.error('Could not save language preference');
    },
  });

  async function toggle() {
    await setAppLanguage(next);
    if (user) {
      mutation.mutate(next);
    }
  }

  const label = current === 'en' ? 'EN' : 'HA';
  const title = current === 'en' ? t('language.hausa') : t('language.english');

  return (
    <button
      type="button"
      title={`${t('language.switch')}: ${title}`}
      aria-label={`${t('language.switch')}: ${title}`}
      onClick={() => void toggle()}
      disabled={mutation.isPending}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50',
        className,
      )}
    >
      <Globe className="size-3.5" aria-hidden />
      {!compact ? <span>{label}</span> : <span className="font-semibold">{label}</span>}
    </button>
  );
}
