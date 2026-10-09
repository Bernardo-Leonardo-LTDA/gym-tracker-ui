import { STORAGE_SESSION_TOKEN_KEY, STORAGE_USER_ID_KEY } from '../types';

export function getStoredSessionToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getSessionHeaders(userId: string): Record<string, string> {
  try {
    const token = getStoredSessionToken();
    return token && localStorage.getItem(STORAGE_USER_ID_KEY) === userId
      ? { Authorization: `Bearer ${token}` }
      : {};
  } catch {
    return {};
  }
}
