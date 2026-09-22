import { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';
import { getFindErrorMessage } from './utils';

describe('find error messages', () => {
  it('explains an invalid address without showing the HTTP error', () => {
    const error = new AxiosError('Request failed with status code 400');
    error.response = { status: 400 } as AxiosError['response'];

    expect(getFindErrorMessage(error, true)).toBe(
      "We couldn't find that address. Check it and try again."
    );
  });

  it('keeps location permission errors useful', () => {
    expect(
      getFindErrorMessage(new Error('Location permission was denied.'), false)
    ).toBe('Location permission was denied.');
  });
});
