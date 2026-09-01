import { adaptPlaceToGym } from './services/gyms.service';
import type { Gym, PlacesApiPlace } from './types';

export function toGyms(
  results: (Gym | PlacesApiPlace)[] | undefined,
  fallback: Gym[]
): Gym[] {
  if (!results?.length) return fallback;

  return results.map((result, index) =>
    isGym(result) ? result : adaptPlaceToGym(result, index)
  );
}

export function filterGyms(gyms: Gym[], query: string): Gym[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return gyms;

  return gyms.filter((gym) =>
    `${gym.name} ${gym.area}`.toLowerCase().includes(normalizedQuery)
  );
}

export function getRequestErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Failed to check in. Please try again.';
}

function isGym(result: Gym | PlacesApiPlace): result is Gym {
  return 'photo' in result;
}
