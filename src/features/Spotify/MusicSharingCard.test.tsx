// @vitest-environment jsdom
import { act, type ComponentProps } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MusicSharingCard } from './MusicSharingCard';
import { spotifyApi, type MusicSharingStatus } from './api';

vi.mock('./api', () => ({ spotifyApi: { disable: vi.fn() } }));
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled }: ComponentProps<'button'>) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

describe('Music card live state', () => {
  let root: Root;
  let container: HTMLDivElement;
  const now = Date.now();
  const playing: MusicSharingStatus = {
    connected: true,
    enabled: true,
    provider: 'spotify',
    state: 'playing',
    music: {
      title: 'Old track',
      artist: 'Artist',
      source: 'Spotify',
      isPlaying: true,
      updatedAt: new Date(now).toISOString(),
    },
  };
  const paused: MusicSharingStatus = {
    ...playing,
    enabled: false,
    state: 'paused',
    music: null,
  };
  const onChanged = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.clearAllMocks();
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });
  afterEach(async () => {
    await act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });
  const render = (status: MusicSharingStatus | null) =>
    act(() =>
      root.render(
        <MusicSharingCard
          userId="owner"
          now={now}
          onChanged={onChanged}
          liveStatus={status}
        />
      )
    );

  it('never overwrites a newer pushed status with a late HTTP action response', async () => {
    let resolve!: (status: MusicSharingStatus) => void;
    vi.mocked(spotifyApi.disable).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      })
    );
    await render(playing);
    const stop = [...container.querySelectorAll('button')].find(
      (button) => button.textContent === 'Stop sharing'
    )!;
    await act(() => stop.click());
    await render(paused);
    expect(container.textContent).not.toContain('Old track');
    await act(() => resolve(playing));
    expect(container.textContent).toContain('Sharing is off');
    expect(container.textContent).not.toContain('Old track');
    expect(onChanged).toHaveBeenCalledOnce();
  });

  it('clears playback and disables actions when the live connection is unavailable', async () => {
    await render(playing);
    expect(container.textContent).toContain('Old track');
    await render(null);
    expect(container.textContent).not.toContain('Old track');
    expect(
      [...container.querySelectorAll('button')].every(
        (button) => button.disabled
      )
    ).toBe(true);
  });
});
