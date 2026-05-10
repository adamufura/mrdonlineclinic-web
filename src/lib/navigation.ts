/**
 * Prevents open redirects: only same-origin relative paths are allowed.
 */
export function safeReturnPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) {
    return null;
  }
  return raw;
}
