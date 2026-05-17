import { z } from 'zod';

/** Allowed password characters: letters, digits, common symbols. */
export const PASSWORD_PATTERN = /^[A-Za-z0-9!@#$%^&*()_+\-=[\]{}|;:'",.<>?/~`]+$/;

const PASSWORD_MESSAGE = 'Use 6–12 characters: letters, numbers, or special characters only';

/** Mirrors backend `auth.validation` password rules. */
export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(12, 'Password must be at most 12 characters')
  .regex(PASSWORD_PATTERN, PASSWORD_MESSAGE);

/** @deprecated Use `passwordSchema`. */
export const strongPasswordSchema = passwordSchema;

export const mongoIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id');
