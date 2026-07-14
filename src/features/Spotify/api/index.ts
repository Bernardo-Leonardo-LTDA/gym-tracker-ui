import api from '@/config/api';

export interface SpotifyTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface SpotifyTrack {
  artist: string;
  durationMs: number;
  isPlaying: boolean;
  progressMs: number;
  trackName: string;
}

export const spotifyApi = {
  exchangeCode: async (
    code: string,
    codeVerifier: string
  ): Promise<SpotifyTokenResponse> => {
    const { data } = await api.post<SpotifyTokenResponse>(
      '/auth/spotify/callback',
      { code, codeVerifier }
    );
    return data;
  },

  getCurrentlyPlaying: async (accessToken: string): Promise<SpotifyTrack> => {
    const { data } = await api.get<SpotifyTrack>('/spotify/currently-playing', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data;
  },

  syncWeb: async (accessToken: string, userId: string): Promise<void> => {
    await api.post('/spotify/web/sync', { accessToken, userId });
  },
};
