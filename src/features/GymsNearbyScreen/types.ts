// Backend contract: gym-tracker-service/src/modules/gyms/gyms.controller.ts
// POST /gyms/check-in  -> { gymId, userId, userName } => User
// GET  /gyms/search    -> Partial<PlaceData>[]  (new Places API shape)

export type Gym = {
  id: string;
  name: string;
  area: string;
  distance: string;
  active: number;
  photo: string;
};

// Raw shape returned by backend search. MapsService now uses the new Places API
// (places.googleapis.com/v1/places:searchNearby) with FieldMask
// `places.id,places.displayName,places.formattedAddress,places.rating`
// at `gym-tracker-service/src/shared/services/maps/maps.service.ts:56`.
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
  /** UUID v4 - backend enforces ParseUUIDPipe (gyms.controller.ts:42) */
  userId: string;
  userName: string;
};

export const STORAGE_USER_ID_KEY = 'gym-tracker:userId';
export const STORAGE_USER_NAME_KEY = 'gym-tracker:userName';
