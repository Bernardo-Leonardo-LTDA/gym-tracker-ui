import { describe, expect, it, vi } from 'vitest';
import { consumeSpotifyCallback } from './oauth-callback';

function browser(hash: string, stored: string | null) {
  let value = stored;
  return {
    location: { hash, pathname: '/active', search: '?from=spotify' },
    history: { state: null, replaceState: vi.fn() },
    sessionStorage: {
      getItem: () => value,
      removeItem: () => {
        value = null;
      },
    },
  };
}

describe('Spotify OAuth callback', () => {
  const expected = JSON.stringify({
    state: 'valid-state',
    sessionToken: 'owner-session',
  });
  it('accepts the callback only for the original check-in and removes the token from the URL', () => {
    const page = browser(
      '#spotify_access_token=synthetic-token&state=valid-state',
      expected
    );
    expect(consumeSpotifyCallback(page, 'owner-session')).toEqual({
      accessToken: 'synthetic-token',
      sessionToken: 'owner-session',
    });
    expect(page.history.replaceState).toHaveBeenCalledWith(
      null,
      '',
      '/active?from=spotify'
    );
    expect(consumeSpotifyCallback(page, 'owner-session')).toHaveProperty(
      'error'
    );
  });
  it.each([null, 'another-session'])(
    'rejects a callback after checkout or a different check-in: %s',
    (sessionToken) => {
      expect(
        consumeSpotifyCallback(
          browser(
            '#spotify_access_token=synthetic-token&state=valid-state',
            expected
          ),
          sessionToken
        )
      ).toHaveProperty('error');
    }
  );
  it('rejects state mismatches and reports denied permissions', () => {
    expect(
      consumeSpotifyCallback(
        browser(
          '#spotify_access_token=synthetic-token&state=wrong-state',
          expected
        ),
        'owner-session'
      )
    ).toHaveProperty('error');
    expect(
      consumeSpotifyCallback(
        browser('#spotify_error=access_denied&state=valid-state', expected),
        'owner-session'
      )
    ).toEqual({
      error: 'Spotify permission was not granted. Try connecting again.',
    });
  });

  it('reports a token exchange failure without incorrectly blaming denied consent', () => {
    expect(
      consumeSpotifyCallback(
        browser(
          '#spotify_error=token_exchange_failed&state=valid-state',
          expected
        ),
        'owner-session'
      )
    ).toEqual({
      error: 'Could not finish connecting to Spotify. Please try again.',
    });
  });
});
