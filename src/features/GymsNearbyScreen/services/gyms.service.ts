import { api } from '@/lib/api';
import type {
  CheckInPayload,
  PlacesApiPlace,
  SearchGymsResponse,
  User,
  Gym,
} from '../types';
import { STORAGE_USER_ID_KEY, STORAGE_USER_NAME_KEY } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
  // Some axios wrappers return { data: [...] } already unwrapped, but if raw Places API
  // response leaked through it will still be handled.
  return [];
}

/**
 * Adapt a Places API result to the UI `Gym` card shape.
 * The UI originally used hardcoded gyms with area/distance/active/photo.
 * For real data we fallback to sensible defaults; `distance` and `active`
 * are not returned by the Places search and stay placeholder until a
 * follow-up endpoint provides them.
 */
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

// ---------------------------------------------------------------------------
// API calls — map 1:1 to gym-tracker-service GymsController
// ---------------------------------------------------------------------------

/**
 * GET /gyms/search?address=&radius=
 * Backend: GymsService.searchGymsNearby(address, radius)
 */
export async function searchGymsNearby(
  address: string,
  radius = 1500
): Promise<PlacesApiPlace[]> {
  const { data } = await api.get<SearchGymsResponse>('/gyms/search', {
    params: { address, radius },
  });
  return normalizeSearchResponse(data);
}

/**
 * POST /gyms/check-in
 * Backend: GymsController.checkIn({ gymId, userId, userName })
 *
 * - If `userId` is a valid UUID, backend checks that user in.
 * - If `userId` is null, backend creates a new user (requires `userName`).
 * On success the returned User.id is persisted to localStorage so next
 * check-ins can reuse it without prompting for a name.
 */
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
  // Backend: gyms.controller.ts:42 -> @Body('userId', ParseUUIDPipe) enforces UUID string.
  // We must NOT send null/undefined/number — must be UUID string per service contract.
  // gymId is externalPlaceId (Google Places id, e.g. "ChIJ...") — not a UUID, so no UUID check.
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
      // storage may be unavailable (SSR / private mode) — ignore
    }
  }

  return data;
}

/**
 * GET /gyms/checked-users?gymId=&userId=
 * Requires the caller to be actively checked-in to `gymId`.
 */
export async function fetchCheckedUsersInMyGym(
  gymId: string,
  userId: string
): Promise<User[]> {
  const { data } = await api.get<User[]>('/gyms/checked-users', {
    params: { gymId, userId },
  });
  return data;
}

/**
 * POST /gyms/check-out  (204)
 */
export async function checkOut(userId: string): Promise<void> {
  await api.post('/gyms/check-out', { userId });
}

// ---------------------------------------------------------------------------
// Convenience — read persisted user
// ---------------------------------------------------------------------------

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
