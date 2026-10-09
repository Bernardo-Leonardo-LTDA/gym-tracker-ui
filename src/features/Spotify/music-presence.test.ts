import { describe, expect, it } from 'vitest';
import type { MusicTrack } from '@/features/GymsNearbyScreen/types';
import {
  attendeeMusicText,
  freshMusic,
  MAX_MUSIC_AGE_MS,
} from './music-presence';

describe('Music freshness on the screen', () => {
  const now = Date.parse('2026-10-06T12:00:00Z');
  const music: MusicTrack = {
    title: 'Song',
    artist: 'Artist',
    source: 'Spotify',
    isPlaying: true,
    updatedAt: new Date(now).toISOString(),
  };

  it('displays the title and artist returned for an attendee', () => {
    expect(attendeeMusicText(music, now)).toBe('Song — Artist · Spotify');
    expect(attendeeMusicText(null, now)).toBe('No live music available');
  });

  it('expires cached playback without needing another successful request', () => {
    expect(freshMusic(music, now + MAX_MUSIC_AGE_MS - 1)).toEqual(music);
    expect(freshMusic(music, now + MAX_MUSIC_AGE_MS)).toBeNull();
    expect(attendeeMusicText(music, now + MAX_MUSIC_AGE_MS)).toBe(
      'No live music available'
    );
  });

  it.each(['invalid', '2000-01-01T00:00:00Z', '2026-10-07T12:00:00Z'])(
    'never presents an invalid or expired timestamp as live: %s',
    (updatedAt) => {
      expect(freshMusic({ ...music, updatedAt }, now)).toBeNull();
    }
  );
});
