import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSessionHeaders } from './session';
import { getActiveSession, clearActiveSession } from './index';
import {
  STORAGE_ACTIVE_SESSION_KEY,
  STORAGE_SESSION_TOKEN_KEY,
  STORAGE_USER_ID_KEY,
  STORAGE_USER_NAME_KEY,
} from '../types';

describe('Private guest session storage', () => {
  let storage: Map<string, string>;
  beforeEach(() => {
    storage = new Map();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    });
  });

  it('never attaches the owner credential to a request for another user', () => {
    storage.set(STORAGE_USER_ID_KEY, 'owner');
    storage.set(STORAGE_SESSION_TOKEN_KEY, 'private-token');
    expect(getSessionHeaders('owner')).toEqual({
      Authorization: 'Bearer private-token',
    });
    expect(getSessionHeaders('another-user')).toEqual({});
  });

  it('requires a fresh guest check-in for legacy sessions without an owner credential', () => {
    storage.set(
      STORAGE_ACTIVE_SESSION_KEY,
      JSON.stringify({
        userId: 'legacy',
        gymId: 'gym',
        gymName: 'Gym',
        checkedInAt: '2026-10-06T12:00:00Z',
      })
    );
    storage.set(STORAGE_USER_ID_KEY, 'legacy');
    storage.set(STORAGE_USER_NAME_KEY, 'Ana');
    expect(getActiveSession()).toBeNull();
    expect(storage.has(STORAGE_USER_ID_KEY)).toBe(false);
    expect(storage.get(STORAGE_USER_NAME_KEY)).toBe('Ana');
  });

  it('removes the private credential at checkout while retaining the reusable profile', () => {
    storage.set(STORAGE_USER_ID_KEY, 'owner');
    storage.set(STORAGE_SESSION_TOKEN_KEY, 'private-token');
    clearActiveSession();
    expect(storage.has(STORAGE_SESSION_TOKEN_KEY)).toBe(false);
    expect(storage.get(STORAGE_USER_ID_KEY)).toBe('owner');
  });

  it('does not clear a new session when the previous socket is revoked', () => {
    storage.set(STORAGE_SESSION_TOKEN_KEY, 'new-session');
    clearActiveSession('old-session');
    expect(storage.get(STORAGE_SESSION_TOKEN_KEY)).toBe('new-session');
  });
});
