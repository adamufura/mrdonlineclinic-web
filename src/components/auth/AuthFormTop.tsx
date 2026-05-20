import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { ROUTES } from '@/router/routes';

export function AuthFormTop() {
  const { t } = useTranslation();
  return (
    <div className="mb-2 flex items-center justify-between gap-4">
      <Link
        to={ROUTES.home}
        className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-500 transition-colors hover:text-brand-navy"
      >
        <ArrowLeft className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
        {t('auth.backHome')}
      </Link>
      <LanguageSwitcher />
    </div>
  );
}
