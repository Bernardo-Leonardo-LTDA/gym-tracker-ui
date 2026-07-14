import api from '@/config/api';

export interface SpotifyTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface SpotifyTrack {
  is_playing: boolean;
  item: {
    name: string;
    artists: { name: string }[];
    duration_ms: number;
  } | null;
  progress_ms: number;
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
};
