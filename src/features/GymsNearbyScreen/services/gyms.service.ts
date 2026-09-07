import { api } from '@/lib/api';
import type {
  CheckInPayload,
  PlacesApiPlace,
  SearchGymsResponse,
  User,
  Gym,
} from '../types';
import { STORAGE_USER_ID_KEY, STORAGE_USER_NAME_KEY } from '../types';

function normalizeSearchResponse(data: SearchGymsResponse): PlacesApiPlace[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as PlacesApiPlace[];
  if (
    typeof data === 'object' &&
    'places' in data &&
    Array.isArray((data as { places: unknown }).places)
  ) {
    return (data as { places: PlacesApiPlace[] }).places;
  }
  return [];
}

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

export async function searchGymsNearby(
  address: string,
  radius = 1500
): Promise<PlacesApiPlace[]> {
  const { data } = await api.get<SearchGymsResponse>('/gyms/search', {
    params: { address, radius },
  });
  return normalizeSearchResponse(data);
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
  assertUuid(payload.userId, 'userId');
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
    } catch {
      // Ignore unavailable storage.
    }
  }

  return data;
}

export async function fetchCheckedUsersInMyGym(
  gymId: string,
  userId: string
): Promise<User[]> {
  const { data } = await api.get<User[]>('/gyms/checked-users', {
    params: { gymId, userId },
  });
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
  await api.post('/gyms/check-out', { userId });
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
