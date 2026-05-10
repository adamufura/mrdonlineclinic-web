import { z } from 'zod';

/** Mirrors backend `auth.validation` strong password rules. */
export const strongPasswordSchema = z
  .string()
  .min(8)
  .max(128)
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
    'Use upper & lower case, a number, and a special character',
  );

export const mongoIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id');
