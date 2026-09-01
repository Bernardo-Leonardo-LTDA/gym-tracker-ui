import { describe, expect, it } from 'vitest';
import type { Gym, PlacesApiPlace } from './types';
import { filterGyms, getRequestErrorMessage, toGyms } from './utils';

const fallbackGym: Gym = {
  id: 'fallback',
  name: 'Fallback Fitness',
  area: 'Downtown',
  distance: '0.4 mi',
  active: 3,
  photo: 'linear-gradient(#111, #222)',
};

describe('nearby gym result helpers', () => {
  it('uses fallback data when navigation state has no results', () => {
    expect(toGyms(undefined, [fallbackGym])).toEqual([fallbackGym]);
    expect(toGyms([], [fallbackGym])).toEqual([fallbackGym]);
  });

  it('keeps UI gyms and adapts Places API results', () => {
    const place: PlacesApiPlace = {
      id: 'place-1',
      displayName: { text: 'Iron Temple' },
      formattedAddress: 'Centro',
    };

    expect(toGyms([fallbackGym, place], [])).toEqual([
      fallbackGym,
      expect.objectContaining({
        id: 'place-1',
        name: 'Iron Temple',
        area: 'Centro',
        distance: '—',
      }),
    ]);
  });

  it('filters gym names and areas without case or surrounding-space sensitivity', () => {
    const gyms: Gym[] = [
      fallbackGym,
      { ...fallbackGym, id: 'second', name: 'Iron Temple', area: 'Centro' },
    ];

    expect(filterGyms(gyms, '  CENTRO ')).toEqual([gyms[1]]);
    expect(filterGyms(gyms, '')).toEqual(gyms);
  });

  it('uses a safe fallback for non-Error failures', () => {
    expect(getRequestErrorMessage(new Error('Service unavailable'))).toBe(
      'Service unavailable'
    );
    expect(getRequestErrorMessage({ message: 'hidden' })).toBe(
      'Failed to check in. Please try again.'
    );
  });
});
