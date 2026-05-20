import type { TFunction } from 'i18next';

export function timeGreeting(t: TFunction): string {
  const h = new Date().getHours();
  if (h < 12) return t('greeting.morning');
  if (h < 17) return t('greeting.afternoon');
  return t('greeting.evening');
}
