/** In-memory access token is primary; sessionStorage survives full page reloads within the tab. */
const STORAGE_KEY = 'mrd.accessToken';

export function readStoredAccessToken(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeStoredAccessToken(token: string | null): void {
  try {
    if (token) sessionStorage.setItem(STORAGE_KEY, token);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* private mode / disabled storage */
  }
}
