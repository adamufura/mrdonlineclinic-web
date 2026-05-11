import { z } from 'zod';

const absoluteOrRootRelative = z.string().refine(
  (s) => z.string().url().safeParse(s).success || /^\/[^/]/.test(s),
  { message: 'Must be an absolute http(s) URL or a root-relative path (e.g. /api/v1)' },
);

const schema = z.object({
  VITE_API_BASE_URL: absoluteOrRootRelative,
  VITE_SOCKET_URL: z.string().url(),
  VITE_APP_URL: z.string().url().optional(),
});

export type AppEnv = z.infer<typeof schema>;

let cached: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cached) return cached;
  const parsed = schema.safeParse(import.meta.env);
  if (!parsed.success) {
    console.error('Invalid Vite env:', parsed.error.flatten().fieldErrors);
    throw new Error('Missing or invalid environment variables. Copy .env.example to .env');
  }
  cached = parsed.data;
  return cached;
}

export function getAppOrigin(): string {
  const e = getEnv();
  return e.VITE_APP_URL ?? (typeof window !== 'undefined' ? window.location.origin : e.VITE_API_BASE_URL);
}

/** Browser hits this origin so Vite's `/api` proxy applies; avoids localhost vs 127.0.0.1 mismatches. */
export function getApiBaseUrl(): string {
  const base = getEnv().VITE_API_BASE_URL;
  if (/^https?:\/\//i.test(base)) return base;
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${base.startsWith('/') ? base : `/${base}`}`;
  }
  if (import.meta.env.DEV) {
    return `http://127.0.0.1:5173${base.startsWith('/') ? base : `/${base}`}`;
  }
  return base;
}
