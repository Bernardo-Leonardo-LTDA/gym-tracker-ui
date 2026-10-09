import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Music2, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  checkOut,
  clearActiveSession,
  fetchActiveCheckIn,
  getActiveSession,
  getStoredUserId,
  getStoredUserName,
  getStoredSessionToken,
  saveActiveSession,
} from '@/features/GymsNearbyScreen/services';
import type { ActiveSession, User } from '@/features/GymsNearbyScreen/types';
import { MusicSharingCard } from '@/features/Spotify/MusicSharingCard';
import { attendeeMusicText } from '@/features/Spotify/music-presence';

import { connectFloor } from './live-floor';
import type { MusicSharingStatus } from '@/features/Spotify/api';

const AVATAR_COLORS = ['#c43632', '#b84e47', '#c59a4a', '#293f41', '#373737'];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function elapsed(checkedInAt: string, now: number): string {
  const seconds = Math.max(
    0,
    Math.floor((now - Date.parse(checkedInAt)) / 1000)
  );
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

function Avatar({
  user,
  size = 'size-10',
}: {
  user: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  size?: string;
}) {
  if (user.avatarUrl) {
    return (
      <img
        className={`${size} shrink-0 rounded-full object-cover`}
        src={user.avatarUrl}
        alt=""
      />
    );
  }
  const color =
    AVATAR_COLORS[
      Array.from(user.id).reduce(
        (total, char) => total + char.charCodeAt(0),
        0
      ) % AVATAR_COLORS.length
    ];
  return (
    <span
      className={`${size} shrink-0 rounded-full grid place-items-center text-sm font-bold text-white`}
      style={{ backgroundColor: color }}
    >
      {initials(user.name)}
    </span>
  );
}

export function ActiveScreen() {
  const navigate = useNavigate();
  const [session, setSession] = useState<ActiveSession | null>(() =>
    getActiveSession()
  );
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRestoring, setIsRestoring] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [musicStatus, setMusicStatus] = useState<MusicSharingStatus | null>(
    null
  );
  const live = useRef<ReturnType<typeof connectFloor> | null>(null);
  const clockOffset = useRef(0);

  useEffect(() => {
    if (session) {
      setIsRestoring(false);
      return;
    }
    const userId = getStoredUserId();
    const userName = getStoredUserName();
    const sessionToken = getStoredSessionToken();
    if (!userId || !userName || !sessionToken) {
      setIsRestoring(false);
      return;
    }
    let cancelled = false;
    void fetchActiveCheckIn(userId)
      .then((activeCheckIn) => {
        if (cancelled || getStoredSessionToken() !== sessionToken) return;
        const restored = {
          gymId: activeCheckIn.gymId,
          gymName: 'Your gym',
          userId,
          userName,
          checkedInAt: activeCheckIn.checkedInAt,
        };
        saveActiveSession(restored);
        setSession(restored);
      })
      .catch((cause: unknown) => {
        const status = (cause as { response?: { status?: number } })?.response
          ?.status;
        if (!cancelled && (status === 401 || status === 403))
          clearActiveSession(sessionToken);
      })
      .finally(() => {
        if (!cancelled) setIsRestoring(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  const refresh = useCallback(() => {
    live.current?.refresh();
  }, []);

  useEffect(() => {
    if (!session && !isRestoring) {
      navigate('/', { replace: true });
    }
  }, [isRestoring, navigate, session]);

  useEffect(() => {
    if (!session) return;
    const sessionToken = getStoredSessionToken();
    const connection = connectFloor(session.userId, {
      snapshot: ({ users: attendees, status, serverTime }) => {
        const timestamp = Date.parse(serverTime);
        if (Number.isFinite(timestamp))
          clockOffset.current = timestamp - Date.now();
        setNow(Date.now() + clockOffset.current);
        setUsers(attendees);
        setMusicStatus(status);
        setError(null);
        setLoading(false);
      },
      unavailable: () => {
        setUsers((previous) =>
          previous.map((user) => ({ ...user, music: null }))
        );
        setMusicStatus(null);
        setError('Live updates disconnected. Reconnecting…');
        setLoading(false);
      },
      ended: () => {
        clearActiveSession(sessionToken);
        setSession(null);
      },
    });
    live.current = connection;
    const onFocus = () => connection.refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      connection.close();
      live.current = null;
    };
  }, [session]);

  useEffect(() => {
    const timer = window.setInterval(
      () => setNow(Date.now() + clockOffset.current),
      1000
    );
    return () => window.clearInterval(timer);
  }, []);

  const self = useMemo(
    () => users.find((user) => user.id === session?.userId),
    [session?.userId, users]
  );
  const others = useMemo(
    () => users.filter((user) => user.id !== session?.userId),
    [session?.userId, users]
  );
  const currentUser: User = self ?? {
    id: session?.userId ?? 'you',
    name: session?.userName ?? 'You',
    avatarUrl: null,
    createdAt: '',
    checkedInAt: session?.checkedInAt,
  };
  async function handleCheckOut(): Promise<void> {
    if (!session) return;
    const sessionToken = getStoredSessionToken();
    setIsCheckingOut(true);
    try {
      await checkOut(session.userId);
      clearActiveSession(sessionToken);
      navigate('/', { replace: true });
    } catch {
      setError('Could not check out. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  }

  if (!session)
    return isRestoring ? (
      <main className="grid min-h-dvh place-items-center bg-background text-sm text-muted-foreground">
        Restoring your check-in…
      </main>
    ) : null;

  return (
    <main className="flex min-h-dvh w-full items-center justify-center bg-background text-foreground md:py-10">
      <div className="w-full bg-background px-6 pb-8 pt-8 md:max-w-lg md:rounded-3xl md:border md:border-border md:shadow-2xl">
        <section className="rounded-3xl border border-border bg-linear-to-br from-[#261e1c] to-[#151414] p-4">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="flex items-center gap-2">
              <i className="size-2 rounded-full bg-primary" />
              LIVE
            </span>
            <time className="font-normal text-muted-foreground">
              {elapsed(currentUser.checkedInAt ?? session.checkedInAt, now)}
            </time>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Avatar user={currentUser} size="size-11" />
            <div className="min-w-0">
              <p className="text-[11px] tracking-wide text-muted-foreground">
                YOU'RE AT
              </p>
              <h1 className="text-base font-bold leading-snug wrap-break-word">
                {session.gymName}
              </h1>
            </div>
          </div>
          <MusicSharingCard
            key={session.userId}
            userId={session.userId}
            now={now}
            liveStatus={musicStatus}
            onChanged={refresh}
          />
        </section>
        <section className="mt-7">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">On the floor</h2>
            <span className="text-xs text-muted-foreground">
              {others.length} active
            </span>
          </div>
          {error && (
            <div
              role="status"
              className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              {error}
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={() => void refresh()}
                aria-label="Retry refresh"
              >
                <RefreshCw />
              </Button>
            </div>
          )}
          {loading ? (
            <p className="mt-6 text-sm text-muted-foreground">
              Loading the floor…
            </p>
          ) : others.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              You have the floor to yourself right now.
            </p>
          ) : (
            <ul className="mt-3 space-y-1">
              {others.map((user) => (
                <li
                  key={user.id}
                  className="flex min-h-16 items-center gap-3 py-2"
                >
                  <Avatar user={user} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {user.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {attendeeMusicText(user.music, now)}
                    </p>
                  </div>
                  <span
                    className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-[#edc66c]"
                    aria-hidden="true"
                  >
                    <Music2 size={15} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <Button
          onClick={() => void handleCheckOut()}
          disabled={isCheckingOut}
          className="mt-8 h-12 w-full rounded-2xl bg-[#e67568] text-sm font-semibold text-black hover:bg-[#ee8579]"
        >
          {isCheckingOut ? 'Checking out…' : 'Check out'}
        </Button>
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          You’ll stop appearing on the floor instantly.
        </p>
      </div>
    </main>
  );
}
