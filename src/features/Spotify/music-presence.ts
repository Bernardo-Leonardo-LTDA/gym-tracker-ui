import type { MusicTrack } from '@/features/GymsNearbyScreen/types';

export const MAX_MUSIC_AGE_MS = 90_000;

export function freshMusic(
  music: MusicTrack | null | undefined,
  now: number
): MusicTrack | null {
  if (!music?.isPlaying) return null;
  const updatedAt = Date.parse(music.updatedAt);
  const age = now - updatedAt;
  return Number.isFinite(updatedAt) && age >= -5_000 && age < MAX_MUSIC_AGE_MS
    ? music
    : null;
}

export function attendeeMusicText(
  music: MusicTrack | null | undefined,
  now: number
): string {
  const current = freshMusic(music, now);
  return current
    ? `${current.title} — ${current.artist} · ${current.source}`
    : 'No live music available';
}
