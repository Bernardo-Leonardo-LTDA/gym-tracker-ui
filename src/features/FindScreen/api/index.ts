import { api } from '@/lib/api';

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

interface SearchGymsResponse {
  places?: GymSearchResult[];
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
};
