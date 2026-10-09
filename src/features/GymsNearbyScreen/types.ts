export type Gym = {
  id: string;
  name: string;
  area: string;
  distance: string;
  active: number;
  photo: string;
};

export type PlacesApiPlace = {
  id: string;
  displayName?: { text: string; languageCode?: string };
  formattedAddress?: string;
  rating?: number;
};

export type User = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  music?: MusicTrack | null;
  createdAt: string;
  checkedInAt?: string;
  sessionToken?: string;
};

export type MusicTrack = {
  title: string;
  artist: string;
  source: string;
  isPlaying: true;
  updatedAt: string;
};

export type CheckInPayload = {
  gymId: string;
  userId: string | null;
  userName: string;
};

export const STORAGE_USER_ID_KEY = 'gym-tracker:userId';
export const STORAGE_USER_NAME_KEY = 'gym-tracker:userName';
export const STORAGE_ACTIVE_SESSION_KEY = 'gym-tracker:activeSession';
export const STORAGE_SESSION_TOKEN_KEY = 'gym-tracker:sessionToken';

export type ActiveSession = {
  gymId: string;
  gymName: string;
  userId: string;
  userName: string;
  checkedInAt: string;
};
