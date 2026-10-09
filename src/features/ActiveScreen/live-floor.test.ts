import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { connectFloor } from './live-floor';

vi.mock('@/lib/api', () => ({
  api: { defaults: { baseURL: 'http://localhost:3000' } },
}));
vi.mock('@/features/GymsNearbyScreen/services/session', () => ({
  getSessionHeaders: () => ({ Authorization: 'Bearer private-session' }),
}));
const snapshot = {
  users: [{ id: 'other', music: { title: 'Canção' } }],
  status: { music: null },
  serverTime: '2026-10-08T20:00:00Z',
};
const encoder = new TextEncoder();
const frame = (event: string, data: unknown) =>
  encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

function stream(signal?: AbortSignal | null) {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const body = new ReadableStream<Uint8Array>({
    start(value) {
      controller = value;
      signal?.addEventListener('abort', () => {
        try {
          value.error(new DOMException('Aborted', 'AbortError'));
        } catch {
          /* already closed */
        }
      });
    },
  });
  return {
    controller,
    response: new Response(body, {
      headers: { 'Content-Type': 'text/event-stream' },
    }),
  };
}
const handlers = () => ({
  snapshot: vi.fn(),
  unavailable: vi.fn(),
  ended: vi.fn(),
});

describe('Authenticated SSE floor', () => {
  const fetchMock = vi.fn<typeof fetch>();
  let live: ReturnType<typeof connectFloor> | undefined;
  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    live?.close();
    live = undefined;
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('does not start a stream for a discarded StrictMode mount', async () => {
    live = connectFloor('viewer', handlers());
    live.close();
    await vi.advanceTimersByTimeAsync(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps the token in headers and parses fragmented UTF-8 snapshots', async () => {
    const h = handlers();
    let channel!: ReturnType<typeof stream>;
    fetchMock.mockImplementation((_url, init) => {
      channel = stream(init?.signal);
      return Promise.resolve(channel.response);
    });
    live = connectFloor('viewer', h);
    await vi.advanceTimersByTimeAsync(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/gyms/events?userId=viewer',
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer private-session',
          Accept: 'text/event-stream',
        },
      })
    );
    const bytes = frame('snapshot', snapshot);
    for (const byte of bytes) channel.controller.enqueue(Uint8Array.of(byte));
    await vi.advanceTimersByTimeAsync(1);
    expect(h.snapshot).toHaveBeenCalledWith(snapshot);
    expect(h.unavailable).not.toHaveBeenCalled();
  });

  it('reconnects after network failure and stops on HTTP authorization failure', async () => {
    const h = handlers();
    fetchMock
      .mockRejectedValueOnce(new Error('Offline'))
      .mockResolvedValueOnce(new Response(null, { status: 401 }));
    live = connectFloor('viewer', h);
    await vi.advanceTimersByTimeAsync(1);
    expect(h.unavailable).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(1000);
    expect(h.ended).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('stops on permanent client errors but retries rate limiting', async () => {
    const h = handlers();
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 429 }))
      .mockResolvedValueOnce(new Response(null, { status: 400 }));
    live = connectFloor('viewer', h);
    await vi.advanceTimersByTimeAsync(1);
    expect(h.unavailable).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(1000);
    expect(h.ended).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('stops reconnecting when the server revokes the check-in', async () => {
    const h = handlers();
    let channel!: ReturnType<typeof stream>;
    fetchMock.mockImplementation((_url, init) => {
      channel = stream(init?.signal);
      return Promise.resolve(channel.response);
    });
    live = connectFloor('viewer', h);
    await vi.advanceTimersByTimeAsync(1);
    channel.controller.enqueue(frame('session-ended', {}));
    await vi.advanceTimersByTimeAsync(60_000);
    expect(h.ended).toHaveBeenCalledOnce();
    expect(h.unavailable).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('reconnects a stalled stream and cancels the old request on manual refresh', async () => {
    const h = handlers();
    const signals: AbortSignal[] = [];
    fetchMock.mockImplementation((_url, init) => {
      signals.push(init!.signal!);
      return Promise.resolve(stream(init?.signal).response);
    });
    live = connectFloor('viewer', h);
    await vi.advanceTimersByTimeAsync(1);
    live.refresh();
    await vi.advanceTimersByTimeAsync(1);
    expect(signals[0].aborted).toBe(true);
    expect(h.unavailable).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(46_000);
    expect(h.unavailable).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
