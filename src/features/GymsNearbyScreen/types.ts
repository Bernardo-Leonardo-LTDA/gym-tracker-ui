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

export type SearchGymsResponse =
  PlacesApiPlace[] | { places: PlacesApiPlace[] };

export type User = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  currentSongTitle?: string | null;
  currentSongArtist?: string | null;
  currentSongExternalId?: string | null;
  currentSongUpdatedAt?: string | null;
  createdAt: string;
};

export type CheckInPayload = {
  gymId: string;
  userId: string;
  userName: string;
};

export const STORAGE_USER_ID_KEY = 'gym-tracker:userId';
export const STORAGE_USER_NAME_KEY = 'gym-tracker:userName';
