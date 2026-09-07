import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { api } from '@/lib/api';
import {
  checkIn,
  fetchCheckedInUserCount,
  fetchCheckedUsersInMyGym,
} from './gyms.service';

const validUserId = '79aa1147-c20c-44f3-8524-b7071ee1af12';

describe('checkIn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects an invalid user ID before sending a request', async () => {
    await expect(
      checkIn({ gymId: 'place-1', userId: 'not-a-uuid', userName: 'Ana' })
    ).rejects.toThrow('Invalid userId');
    expect(api.post).not.toHaveBeenCalled();
  });

  it('rejects a blank user name before sending a request', async () => {
    await expect(
      checkIn({ gymId: 'place-1', userId: validUserId, userName: '   ' })
    ).rejects.toThrow('Invalid userName');
    expect(api.post).not.toHaveBeenCalled();
  });

  it('posts the backend check-in payload when input is valid', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: validUserId } });

    await checkIn({ gymId: 'place-1', userId: validUserId, userName: 'Ana' });

    expect(api.post).toHaveBeenCalledWith('/gyms/check-in', {
      gymId: 'place-1',
      userId: validUserId,
      userName: 'Ana',
    });
  });

  it('gets checked-in users for the current user gym', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    await expect(
      fetchCheckedUsersInMyGym('place-1', validUserId)
    ).resolves.toEqual([]);

    expect(api.get).toHaveBeenCalledWith('/gyms/checked-users', {
      params: { gymId: 'place-1', userId: validUserId },
    });
  });

  it('gets the public attendee count for a gym', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { count: 4 } });

    await expect(fetchCheckedInUserCount('place-1')).resolves.toBe(4);

    expect(api.get).toHaveBeenCalledWith('/gyms/checked-users/count', {
      params: { gymId: 'place-1' },
    });
  });
});
