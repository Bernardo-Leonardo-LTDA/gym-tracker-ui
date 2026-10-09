import { api } from '@/lib/api';
import type { MusicTrack } from '@/features/GymsNearbyScreen/types';
import { getSessionHeaders } from '@/features/GymsNearbyScreen/services/session';

export interface MusicSharingStatus {
  connected: boolean;
  enabled: boolean;
  provider: 'spotify' | null;
  state:
    | 'disconnected'
    | 'paused'
    | 'playing'
    | 'idle'
    | 'unavailable'
    | 'permission-denied'
    | 'reconnect-required';
  music: MusicTrack | null;
}

export const spotifyApi = {
  mobileConfig: async (): Promise<{
    clientId: string;
    redirectUrl: string;
    scope: string;
  }> => {
    const { data } = await api.get<{
      clientId: string;
      redirectUrl: string;
      scope: string;
    }>('/auth/spotify/mobile-config');
    return data;
  },

  connect: async (
    userId: string,
    accessToken: string
  ): Promise<MusicSharingStatus> => {
    const { data } = await api.post<MusicSharingStatus>(
      '/gyms/music/connect',
      {
        userId,
        provider: 'spotify',
        accessToken,
      },
      { headers: getSessionHeaders(userId) }
    );
    return data;
  },

  resume: async (userId: string): Promise<MusicSharingStatus> => {
    const { data } = await api.post<MusicSharingStatus>(
      '/gyms/music/resume',
      {
        userId,
      },
      { headers: getSessionHeaders(userId) }
    );
    return data;
  },

  disable: async (userId: string): Promise<MusicSharingStatus> => {
    const { data } = await api.post<MusicSharingStatus>(
      '/gyms/music/disable',
      {
        userId,
      },
      { headers: getSessionHeaders(userId) }
    );
    return data;
  },

  disconnect: async (userId: string): Promise<MusicSharingStatus> => {
    const { data } = await api.post<MusicSharingStatus>(
      '/gyms/music/disconnect',
      { userId },
      { headers: getSessionHeaders(userId) }
    );
    return data;
  },
};
