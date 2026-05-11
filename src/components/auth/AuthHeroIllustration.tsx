import { useLocation } from 'react-router-dom';
import { ROUTES } from '@/router/routes';
import heroLogin from '@/components/auth/illustrations/hero-login.svg?raw';
import heroRole from '@/components/auth/illustrations/hero-role.svg?raw';
import heroSignup from '@/components/auth/illustrations/hero-signup.svg?raw';

type HeroVariant = 'role' | 'signup' | 'login';

function heroVariant(pathname: string): HeroVariant {
  if (pathname === ROUTES.register || pathname === `${ROUTES.register}/`) return 'role';
  if (pathname.startsWith(ROUTES.registerPatient) || pathname.startsWith(ROUTES.registerPractitioner)) {
    return 'signup';
  }
  return 'login';
}

export function AuthHeroIllustration() {
  const { pathname } = useLocation();
  const variant = heroVariant(pathname);
  const markup = variant === 'role' ? heroRole : variant === 'signup' ? heroSignup : heroLogin;

  return (
    <div
      className="auth-hero-svg relative z-10 mx-auto flex w-full max-w-[min(100%,34rem)] flex-1 flex-col items-center justify-center px-1 py-2 md:py-4 [&>svg]:h-auto [&>svg]:w-full"
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
