export function connectionError(error: unknown): string {
  const response =
    typeof error === 'object' && error !== null && 'response' in error
      ? (
          error as {
            response?: { status?: number; data?: { reason?: string } };
          }
        ).response
      : undefined;
  // 401/403 on gym routes mean the check-in session was rejected; Spotify
  // token problems arrive as 400 with a reason.
  if (response?.status === 401 || response?.status === 403)
    return 'Your check-in has ended. Please check in again.';
  if (response?.data?.reason === 'reconnect-required')
    return 'Spotify connection expired. Connect Spotify again.';
  if (response?.data?.reason === 'permission-denied')
    return 'Spotify denied access. Check account permissions and connect again.';
  if (response?.status === 502)
    return 'Spotify is unavailable right now. Please try again shortly.';
  return 'Could not update music sharing. Check your connection and try again.';
}
