import { z } from 'zod';

const schema = z.object({
  VITE_API_BASE_URL: z.string().url(),
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
