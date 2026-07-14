import { useEffect, useState } from 'react';
import { GenericOAuth2 } from '@capacitor-community/generic-oauth2';
import { Button } from '@/components/ui/button';
import { Capacitor } from '@capacitor/core';
import { spotifyApi, type SpotifyTrack } from './api';
import { useAuthStore } from '@/stores/authStore';

interface AuthOptions {
  authorizationBaseUrl: string;
  accessTokenEndpoint: string;
  clientId: string;
  redirectUrl: string;
  responseType: string;
  scope: string;
  pkceEnabled: boolean;
}

const REDIRECT_URL: string = Capacitor.isNativePlatform()
  ? import.meta.env.VITE_SPOTIFY_REDIRECT_MOBILE
  : import.meta.env.VITE_SPOTIFY_REDIRECT_WEB;

const OAUTH_OPTIONS: AuthOptions = {
  authorizationBaseUrl: 'https://accounts.spotify.com/authorize',
  accessTokenEndpoint: 'https://accounts.spotify.com/api/token',
  clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
  redirectUrl: REDIRECT_URL,
  responseType: 'code',
  scope: import.meta.env.VITE_SPOTIFY_SCOPES,
  pkceEnabled: true,
};

export function Spotify() {
  const [track, setTrack] = useState<SpotifyTrack | null>(null);
  const { accessToken, setTokens, clearTokens } = useAuthStore();

  const handleRefresh = async () => {
    if (!accessToken) return;
    const data = await spotifyApi.getCurrentlyPlaying(accessToken);
    setTrack(data);
  };

  const handleLogin = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const response = await GenericOAuth2.authenticate(OAUTH_OPTIONS);
        const code = response.authorization_response.code;
        const codeVerifier = response.pkce_code_verifier;

        const tokens = await spotifyApi.exchangeCode(code, codeVerifier);
        setTokens(tokens.accessToken, tokens.refreshToken);
      } catch (error) {
        console.error('Spotify login error', error);
      }
    } else {
      window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/spotify/login`;
    }
  };

  const handleLogout = () => {
    clearTokens();
    setTrack(null);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('accessToken');
    if (tokenFromUrl) {
      setTokens(tokenFromUrl, '');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!accessToken) return;

    void spotifyApi.syncWeb(accessToken, 'user123');

    const eventSource = new EventSource(
      `${import.meta.env.VITE_API_BASE_URL}/spotify/web/status-stream?userId=user123`
    );

    eventSource.onmessage = (event) => {
      console.log('Received SSE message:', event.data);
      const musicData: SpotifyTrack = JSON.parse(event.data);
      setTrack(musicData);
      console.log('Updated track state:', musicData);
    };

    eventSource.onerror = (err) => {
      console.error('SSE streaming connection error', err);
    };

    return () => eventSource.close();
  }, [accessToken]);

  return (
    <div className="flex flex-col gap-1 m-2">
      <div className="flex gap-1 items-center">
        <h2>Spotify:</h2>
        {!accessToken ? (
          <Button onClick={handleLogin}>Login</Button>
        ) : (
          <>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
            <Button onClick={handleRefresh}>Atualizar</Button>
          </>
        )}
      </div>
      <div className="p-2 border border-green-500 rounded-md w-fit">
        {track?.isPlaying ? (
          <div>
            <h3>Ouvindo agora:</h3>
            <p>
              <strong>Música:</strong> {track.trackName}
            </p>
            <p>
              <strong>Artista:</strong> {track.artist}
            </p>
          </div>
        ) : (
          <p>Nenhuma música tocando no momento.</p>
        )}
      </div>
    </div>
  );
}
