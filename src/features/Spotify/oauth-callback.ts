export const OAUTH_STATE_KEY = 'gym-tracker:spotify-oauth-state';
export type SpotifyCallback =
  { accessToken: string; sessionToken: string } | { error: string } | null;

interface CallbackBrowser {
  location: Pick<Location, 'hash' | 'pathname' | 'search'>;
  history: Pick<History, 'state' | 'replaceState'>;
  sessionStorage: Pick<Storage, 'getItem' | 'removeItem'>;
}
type OAuthState = { state?: string; sessionToken?: string };

export function consumeSpotifyCallback(
  browser: CallbackBrowser,
  sessionToken: string | null
): SpotifyCallback {
  const hash = new URLSearchParams(browser.location.hash.slice(1));
  const accessToken = hash.get('spotify_access_token');
  const oauthError = hash.get('spotify_error');
  if (!accessToken && !oauthError) return null;
  browser.history.replaceState(
    browser.history.state,
    '',
    browser.location.pathname + browser.location.search
  );
  let expected: OAuthState | null = null;
  try {
    expected = JSON.parse(
      browser.sessionStorage.getItem(OAUTH_STATE_KEY) ?? 'null'
    ) as OAuthState | null;
  } catch {
    /* Unverifiable callbacks must never enable sharing. */
  }
  browser.sessionStorage.removeItem(OAUTH_STATE_KEY);
  if (
    !expected?.state ||
    hash.get('state') !== expected.state ||
    !sessionToken ||
    expected.sessionToken !== sessionToken
  ) {
    return {
      error:
        'Spotify connection could not be verified for this check-in. Try connecting again.',
    };
  }
  if (oauthError)
    return {
      error:
        oauthError === 'token_exchange_failed'
          ? 'Could not finish connecting to Spotify. Please try again.'
          : 'Spotify permission was not granted. Try connecting again.',
    };
  return { accessToken: accessToken!, sessionToken };
}
