import { api } from '@/lib/api';
import type { CheckInPayload, PlacesApiPlace, User, Gym } from '../types';
import { STORAGE_USER_ID_KEY, STORAGE_USER_NAME_KEY } from '../types';
import { STORAGE_ACTIVE_SESSION_KEY, type ActiveSession } from '../types';
import { STORAGE_SESSION_TOKEN_KEY } from '../types';
import { getSessionHeaders, getStoredSessionToken } from './session';
export { getStoredSessionToken } from './session';

export function adaptPlaceToGym(place: PlacesApiPlace, index: number): Gym {
  const fallbackPhotos = [
    'linear-gradient(135deg, #2b2320 0%, #14100e 100%)',
    'linear-gradient(135deg, #2a1a1c 0%, #140d0e 100%)',
    'linear-gradient(135deg, #1f242a 0%, #0f1114 100%)',
    'linear-gradient(135deg, #212a29 0%, #101413 100%)',
  ];

  return {
    id: place.id ?? `gym-${index}`,
    name: place.displayName?.text ?? 'Unknown gym',
    area: place.formattedAddress ?? 'Nearby',
    distance: '—',
    active: 0,
    photo: fallbackPhotos[index % fallbackPhotos.length],
  };
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertUuid(value: string, field: string): void {
  if (typeof value !== 'string' || !UUID_RE.test(value)) {
    throw new Error(
      `Invalid ${field}: expected UUID string, got ${JSON.stringify(value)}`
    );
  }
}

export async function checkIn(payload: CheckInPayload): Promise<User> {
  if (payload.userId) assertUuid(payload.userId, 'userId');
  if (
    !payload.userName ||
    typeof payload.userName !== 'string' ||
    !payload.userName.trim()
  ) {
    throw new Error('Invalid userName: expected non-empty string');
  }

  const body: Record<string, unknown> = {
    gymId: payload.gymId,
    userId: payload.userId,
    userName: payload.userName,
  };

  const { data } = await api.post<User>('/gyms/check-in', body);

  if (data?.id) {
    try {
      localStorage.setItem(STORAGE_USER_ID_KEY, data.id);
      if (data.name) localStorage.setItem(STORAGE_USER_NAME_KEY, data.name);
      if (data.sessionToken)
        localStorage.setItem(STORAGE_SESSION_TOKEN_KEY, data.sessionToken);
    } catch {
      // Ignore unavailable storage.
    }
  }

  return data;
}

export async function fetchCheckedInUserCounts(
  gymIds: string[]
): Promise<Record<string, number>> {
  const { data } = await api.post<Record<string, number>>(
    '/gyms/checked-users/counts',
    { gymIds }
  );
  return data;
}

export async function checkOut(userId: string): Promise<void> {
  await api.post(
    '/gyms/check-out',
    { userId },
    { headers: getSessionHeaders(userId) }
  );
}

export function getStoredUserId(): string | null {
  try {
    return localStorage.getItem(STORAGE_USER_ID_KEY);
  } catch {
    return null;
  }
}

export function getStoredUserName(): string | null {
  try {
    return localStorage.getItem(STORAGE_USER_NAME_KEY);
  } catch {
    return null;
  }
}

export async function fetchActiveCheckIn(
  userId: string
): Promise<{ gymId: string; checkedInAt: string }> {
  const { data } = await api.get<{ gymId: string; checkedInAt: string }>(
    '/gyms/active',
    { params: { userId }, headers: getSessionHeaders(userId) }
  );
  return data;
}

export function saveActiveSession(session: ActiveSession): void {
  try {
    localStorage.setItem(STORAGE_ACTIVE_SESSION_KEY, JSON.stringify(session));
  } catch {
    // Ignore unavailable storage.
  }
}

export function getActiveSession(): ActiveSession | null {
  try {
    const value = localStorage.getItem(STORAGE_ACTIVE_SESSION_KEY);
    if (!value) return null;
    if (!getStoredSessionToken()) {
      // Legacy anonymous sessions have no proof of ownership. Renew the guest
      // check-in instead of requesting a credential with its public user ID.
      localStorage.removeItem(STORAGE_ACTIVE_SESSION_KEY);
      localStorage.removeItem(STORAGE_USER_ID_KEY);
      return null;
    }
    const session = JSON.parse(value) as ActiveSession;
    return session.gymId &&
      session.gymName &&
      session.userId &&
      session.checkedInAt
      ? session
      : null;
  } catch {
    return null;
  }
}

export function clearActiveSession(expectedToken?: string | null): void {
  try {
    if (
      expectedToken !== undefined &&
      getStoredSessionToken() !== expectedToken
    )
      return;
    localStorage.removeItem(STORAGE_ACTIVE_SESSION_KEY);
    localStorage.removeItem(STORAGE_SESSION_TOKEN_KEY);
  } catch {
    // Ignore unavailable storage.
  }
}
