import api from '@/config/api';

export interface GymSearchResult {
  id: string;
  displayName?: {
    text: string;
    languageCode?: string;
  };
  formattedAddress?: string;
  rating?: number;
  location?: SearchCoordinates;
  distanceMeters?: number;
}

export interface SearchCoordinates {
  latitude: number;
  longitude: number;
}

export interface GymUser {
  id: string;
  name: string;
  avatarUrl: string | null;
  currentSongTitle: string | null;
  currentSongArtist: string | null;
  currentSongExternalId: string | null;
  currentSongUpdatedAt: string | null;
  createdAt: string;
}

interface SearchGymsResponse {
  places?: GymSearchResult[];
}

export interface CheckInRequest {
  gymId: string;
  userId: string | null;
  userName?: string;
}

export const gymsApi = {
  search: async (
    address: string,
    radius = 5000
  ): Promise<GymSearchResult[]> => {
    const { data } = await api.get<GymSearchResult[] | SearchGymsResponse>(
      '/gyms/search',
      {
        params: {
          address,
          radius,
        },
      }
    );

    return Array.isArray(data) ? data : (data.places ?? []);
  },

  nearby: async (
    coordinates: SearchCoordinates,
    radius = 5000
  ): Promise<GymSearchResult[]> => {
    const { data } = await api.get<GymSearchResult[]>('/gyms/nearby', {
      params: {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        radius,
      },
    });
    return data;
  },

  getCheckedUsers: async (
    gymId: string,
    userId: string
  ): Promise<GymUser[]> => {
    const { data } = await api.get<GymUser[]>('/gyms/checked-users', {
      params: { gymId, userId },
    });
    return data;
  },

  checkIn: async (request: CheckInRequest): Promise<GymUser> => {
    const { data } = await api.post<GymUser>('/gyms/check-in', request);
    return data;
  },

  checkOut: async (userId: string): Promise<void> => {
    await api.post('/gyms/check-out', { userId });
  },
};
