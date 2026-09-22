import { adaptPlaceToGym } from './services';
import type { Gym, PlacesApiPlace } from './types';

export function toGyms(results: (Gym | PlacesApiPlace)[] | undefined): Gym[] {
  if (!results) return [];

  return results.map((result, index) =>
    isGym(result) ? result : adaptPlaceToGym(result, index)
  );
}

export function getRequestErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Failed to check in. Please try again.';
}

function isGym(result: Gym | PlacesApiPlace): result is Gym {
  return 'photo' in result;
}
