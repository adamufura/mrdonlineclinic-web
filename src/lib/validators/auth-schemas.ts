import type { TFunction } from 'i18next';
import { z } from 'zod';
import { PASSWORD_PATTERN } from '@/lib/validators/auth';

export function createPasswordSchema(t: TFunction) {
  return z
    .string()
    .min(6, t('auth.validation.passwordMin'))
    .max(12, t('auth.validation.passwordMax'))
    .regex(PASSWORD_PATTERN, t('auth.validation.passwordPattern'));
}

export function createMongoIdSchema(t: TFunction) {
  return z.string().regex(/^[a-fA-F0-9]{24}$/, t('auth.validation.invalidId'));
}
