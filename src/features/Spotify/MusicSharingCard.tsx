import { useEffect, useRef, useState } from 'react';
import { GenericOAuth2 } from '@capacitor-community/generic-oauth2';
import { Capacitor } from '@capacitor/core';
import { Music2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { spotifyApi, type MusicSharingStatus } from './api';
import { freshMusic } from './music-presence';
import { connectionError } from './connection-error';
import {
  consumeSpotifyCallback,
  OAUTH_STATE_KEY,
  type SpotifyCallback,
} from './oauth-callback';
import { getStoredSessionToken } from '@/features/GymsNearbyScreen/services/session';

// Consume the URL once and hand its result to the first mounted card only.
let pendingSpotifyCallback = consumeSpotifyCallback(
  window,
  getStoredSessionToken()
);

export function MusicSharingCard({
  userId,
  now,
  onChanged,
  liveStatus,
}: {
  userId: string;
  now: number;
  liveStatus: MusicSharingStatus | null;
  onChanged: () => void | Promise<void>;
}) {
  const callbackRef = useRef<SpotifyCallback>(pendingSpotifyCallback);
  const status = liveStatus;
  const [error, setError] = useState<string | null>(
    callbackRef.current && 'error' in callbackRef.current
      ? callbackRef.current.error
      : null
  );
  const [pending, setPending] = useState(false);
  const loading = status === null;
  const callbackRequest = useRef<Promise<MusicSharingStatus> | null>(null);
  const pendingRef = useRef(false);

  useEffect(() => {
    let active = true;
    pendingSpotifyCallback = null;
    const callback = callbackRef.current;
    if (!callback || !('accessToken' in callback)) return;
    if (getStoredSessionToken() !== callback.sessionToken) {
      setError('Your check-in changed. Connect Spotify again.');
      return;
    }
    pendingRef.current = true;
    setPending(true);
    const request = (callbackRequest.current ??= spotifyApi.connect(
      userId,
      callback.accessToken
    ));
    void request
      .catch((cause: unknown) => {
        if (active) setError(connectionError(cause));
      })
      .finally(() => {
        if (!active) return;
        pendingRef.current = false;
        setPending(false);
        void onChanged();
      });
    return () => {
      active = false;
    };
  }, [userId, onChanged]);

  async function update(
    action: () => Promise<MusicSharingStatus>
  ): Promise<void> {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    setError(null);
    try {
      await action();
    } catch (cause) {
      setError(connectionError(cause));
    } finally {
      pendingRef.current = false;
      setPending(false);
      void onChanged();
    }
  }

  async function connect(): Promise<void> {
    const originalSessionToken = getStoredSessionToken();
    if (Capacitor.isNativePlatform()) {
      await update(async () => {
        const { clientId, redirectUrl, scope } =
          await spotifyApi.mobileConfig();
        const response = await GenericOAuth2.authenticate({
          authorizationBaseUrl: 'https://accounts.spotify.com/authorize',
          accessTokenEndpoint: 'https://accounts.spotify.com/api/token',
          appId: clientId,
          redirectUrl,
          responseType: 'code',
          scope,
          pkceEnabled: true,
        });
        const accessToken = response.access_token as string | undefined;
        if (!accessToken)
          throw new Error('Spotify did not return an access token');
        if (
          !originalSessionToken ||
          getStoredSessionToken() !== originalSessionToken
        )
          throw new Error('Your check-in changed. Connect Spotify again.');
        return spotifyApi.connect(userId, accessToken);
      });
      return;
    }

    const state = crypto.randomUUID();
    const sessionToken = getStoredSessionToken();
    if (!sessionToken) {
      setError('Your check-in expired. Please check in again.');
      return;
    }
    window.sessionStorage.setItem(
      OAUTH_STATE_KEY,
      JSON.stringify({ state, sessionToken })
    );
    const apiBase = api.defaults.baseURL?.replace(/\/$/, '') ?? '';
    window.location.assign(
      `${apiBase}/auth/spotify/login?state=${encodeURIComponent(state)}`
    );
  }

  const music = freshMusic(status?.music, now);
  const detail = loading
    ? 'Checking music sharing…'
    : status?.state === 'playing' && music
      ? `${music.artist} · Now playing`
      : status?.state === 'playing'
        ? 'Playback is out of date. Waiting for an update.'
        : status?.state === 'idle'
          ? 'No shareable playback right now (paused or private).'
          : status?.state === 'paused'
            ? 'Sharing is off. Other people cannot see your music.'
            : status?.state === 'permission-denied'
              ? 'Spotify denied playback access. Disconnect and reconnect.'
              : status?.state === 'reconnect-required'
                ? 'Spotify connection expired. Connect Spotify again.'
                : status?.state === 'unavailable'
                  ? 'Playback unavailable. Reconnect Spotify if this continues.'
                  : 'Share Spotify playback from any device on your account.';
  // An expired token can only be fixed by a new OAuth flow; offer it directly.
  const needsConnect =
    !status?.connected || status.state === 'reconnect-required';

  return (
    <div className="mt-4 rounded-[20px] border border-border bg-black/15 p-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-linear-to-br from-[#f5cd83] to-[#e46b4d] text-black">
          <Music2 size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {music?.title ?? 'Music sharing'}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {detail}
          </p>
        </div>
        {music && (
          <span
            className="flex h-6 shrink-0 items-end gap-[3px] text-[#edc66c]"
            aria-label="Music playing"
          >
            {[10, 18, 24, 14].map((height, index) => (
              <span
                key={height}
                className="equalizer-bar w-[2px] rounded-full bg-current"
                style={{ height, animationDelay: `${index * 0.15}s` }}
              />
            ))}
          </span>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-3 text-xs text-destructive">
          {error}
        </p>
      )}
      <details className="mt-3" open={needsConnect || undefined}>
        <summary className="cursor-pointer text-[11px] text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
          {status?.connected ? 'Manage music sharing' : 'Share your music'}
        </summary>
        <div className="mt-3 flex flex-wrap gap-2">
          {needsConnect ? (
            <Button
              size="sm"
              disabled={pending || loading}
              onClick={() => void connect()}
            >
              Share what I’m listening to
            </Button>
          ) : status?.enabled ? (
            <Button
              size="sm"
              variant="outline"
              disabled={pending || loading}
              onClick={() => void update(() => spotifyApi.disable(userId))}
            >
              Stop sharing
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={pending}
              onClick={() => void update(() => spotifyApi.resume(userId))}
            >
              Share again
            </Button>
          )}
          {status?.connected && (
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => void update(() => spotifyApi.disconnect(userId))}
            >
              Disconnect Spotify
            </Button>
          )}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Only track title, artist and source are shared while you are checked
          in. Other music apps are not supported yet.
        </p>
      </details>
    </div>
  );
}
