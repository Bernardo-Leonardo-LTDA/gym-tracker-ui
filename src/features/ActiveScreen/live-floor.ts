import { createParser } from 'eventsource-parser';
import { api } from '@/lib/api';
import { getSessionHeaders } from '@/features/GymsNearbyScreen/services/session';
import type { User } from '@/features/GymsNearbyScreen/types';
import type { MusicSharingStatus } from '@/features/Spotify/api';

export interface FloorSnapshot {
  users: User[];
  status: MusicSharingStatus;
  serverTime: string;
}

export function connectFloor(
  userId: string,
  handlers: {
    snapshot: (snapshot: FloorSnapshot) => void;
    unavailable: () => void;
    ended: () => void;
  }
) {
  // Fetch streaming supports the private Authorization header; EventSource does not.
  const url = `${api.defaults.baseURL?.replace(/\/$/, '') ?? ''}/gyms/events?userId=${encodeURIComponent(userId)}`;
  const headers = { ...getSessionHeaders(userId), Accept: 'text/event-stream' };
  let closed = false;
  let generation = 0;
  let retryDelay = 1000;
  let controller: AbortController | undefined;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let watchdog: ReturnType<typeof setTimeout> | undefined;

  const stopAttempt = () => {
    generation++;
    clearTimeout(retry);
    clearTimeout(watchdog);
    controller?.abort();
  };
  const close = () => {
    closed = true;
    stopAttempt();
  };
  const ended = () => {
    close();
    handlers.ended();
  };

  async function run(): Promise<void> {
    if (closed) return;
    const attempt = ++generation;
    const abort = new AbortController();
    controller = abort;
    const current = () => !closed && attempt === generation;
    const armWatchdog = () => {
      clearTimeout(watchdog);
      watchdog = setTimeout(() => abort.abort(), 45_000);
    };
    armWatchdog();
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    try {
      const response = await fetch(url, {
        headers,
        signal: abort.signal,
        cache: 'no-store',
      });
      if (!current()) return;
      if (response.status === 401 || response.status === 403) {
        ended();
        return;
      }
      if (
        !response.ok ||
        !response.body ||
        !response.headers.get('content-type')?.includes('text/event-stream')
      )
        throw new Error('Live stream unavailable');
      const parser = createParser({
        onEvent: (message) => {
          if (!current()) return;
          if (message.event === 'session-ended') {
            ended();
            return;
          }
          if (message.event === 'unavailable' || message.event === 'error')
            throw new Error('Live stream interrupted');
          if (message.event === 'snapshot') {
            const snapshot = JSON.parse(message.data) as FloorSnapshot;
            if (
              !Array.isArray(snapshot.users) ||
              !snapshot.status ||
              !Number.isFinite(Date.parse(snapshot.serverTime))
            )
              throw new Error('Invalid live snapshot');
            retryDelay = 1000;
            handlers.snapshot(snapshot);
          }
        },
      });
      reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (current()) {
        const { value, done } = await reader.read();
        if (done || !current()) break;
        armWatchdog();
        parser.feed(decoder.decode(value, { stream: true }));
      }
    } catch {
      // Network loss, server shutdown and malformed responses all reconnect below.
    } finally {
      abort.abort();
      if (reader) {
        await reader.cancel().catch(() => undefined);
        reader.releaseLock();
      }
      if (current()) {
        clearTimeout(watchdog);
        handlers.unavailable();
        retry = setTimeout(() => void run(), retryDelay);
        retryDelay = Math.min(retryDelay * 2, 10_000);
      }
    }
  }

  // A discarded StrictMode mount never starts a network request.
  retry = setTimeout(() => void run(), 0);
  return {
    refresh: () => {
      if (closed) return;
      stopAttempt();
      retry = setTimeout(() => void run(), 0);
    },
    close,
  };
}
