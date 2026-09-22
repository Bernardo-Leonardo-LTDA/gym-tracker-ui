import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn() },
}));

import { api } from '@/lib/api';
import { gymsApi } from './index';

describe('gym search API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends the current coordinates to the nearby endpoint', async () => {
    const gyms = [{ id: 'place-1', displayName: { text: 'Iron Temple' } }];
    vi.mocked(api.get).mockResolvedValue({ data: gyms });

    await expect(
      gymsApi.nearby({ latitude: -23.55, longitude: -46.63 })
    ).resolves.toEqual(gyms);

    expect(api.get).toHaveBeenCalledWith('/gyms/nearby', {
      params: { latitude: -23.55, longitude: -46.63, radius: 5000 },
    });
  });
});
