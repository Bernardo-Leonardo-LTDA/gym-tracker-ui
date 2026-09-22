import { isAxiosError } from 'axios';

export function getFindErrorMessage(
  error: unknown,
  searchingByAddress: boolean
): string {
  if (isAxiosError(error)) {
    if (
      searchingByAddress &&
      [400, 404, 422].includes(error.response?.status ?? 0)
    ) {
      return "We couldn't find that address. Check it and try again.";
    }

    return error.response
      ? 'Unable to search right now. Please try again later.'
      : 'Unable to connect. Check your connection and try again.';
  }

  return error instanceof Error ? error.message : 'Something went wrong.';
}
