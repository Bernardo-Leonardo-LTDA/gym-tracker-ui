import { useCallback, useEffect, useMemo, useState } from 'react';
import { Music2, LogOut, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  checkOut,
  clearActiveSession,
  fetchActiveCheckIn,
  fetchCheckedUsersInMyGym,
  getActiveSession,
  getStoredUserId,
  getStoredUserName,
  saveActiveSession,
} from '@/features/GymsNearbyScreen/services';
import type { ActiveSession, User } from '@/features/GymsNearbyScreen/types';

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
  const seconds = Math.max(0, Math.floor((now - Date.parse(checkedInAt)) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

function Avatar({ user, size = 'size-12' }: { user: Pick<User, 'id' | 'name' | 'avatarUrl'>; size?: string }) {
  if (user.avatarUrl) {
    return <img className={`${size} shrink-0 rounded-full object-cover`} src={user.avatarUrl} alt="" />;
  }
  const color = AVATAR_COLORS[Array.from(user.id).reduce((total, char) => total + char.charCodeAt(0), 0) % AVATAR_COLORS.length];
  return <span className={`${size} shrink-0 rounded-full grid place-items-center text-sm font-bold text-white`} style={{ backgroundColor: color }}>{initials(user.name)}</span>;
}

function trackText(user: User): string {
  if (user.currentSongTitle) return `${user.currentSongTitle} Ã¢â‚¬â€ ${user.currentSongArtist ?? 'Unknown artist'}`;
  return 'No music playing';
}

export function ActiveScreen() {
  const navigate = useNavigate();
  const [session, setSession] = useState<ActiveSession | null>(() => getActiveSession());
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRestoring, setIsRestoring] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (session) {
      setIsRestoring(false);
      return;
    }
    const userId = getStoredUserId();
    const userName = getStoredUserName();
    if (!userId || !userName) {
      setIsRestoring(false);
      return;
    }
    void fetchActiveCheckIn(userId)
      .then((activeCheckIn) => {
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
      .catch(() => clearActiveSession())
      .finally(() => setIsRestoring(false));
  }, [session]);

  const refresh = useCallback(async () => {
    if (!session) return;
    try {
      const attendees = await fetchCheckedUsersInMyGym(session.gymId, session.userId);
      setUsers(attendees);
      setError(null);
    } catch {
      setError('Unable to refresh the floor right now.');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!session && !isRestoring) {
      navigate('/', { replace: true });
      return;
    }
    if (!session) return;
    void refresh();
    const refreshTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, 15_000);
    const onFocus = () => void refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(refreshTimer);
      window.removeEventListener('focus', onFocus);
    };
  }, [isRestoring, navigate, refresh, session]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const self = useMemo(() => users.find((user) => user.id === session?.userId), [session?.userId, users]);
  const others = useMemo(() => users.filter((user) => user.id !== session?.userId), [session?.userId, users]);
  const currentUser: User = self ?? {
    id: session?.userId ?? 'you', name: session?.userName ?? 'You', avatarUrl: null, createdAt: '', checkedInAt: session?.checkedInAt,
  };
  async function handleCheckOut(): Promise<void> {
    if (!session) return;
    setIsCheckingOut(true);
    try {
      await checkOut(session.userId);
      clearActiveSession();
      navigate('/', { replace: true });
    } catch {
      setError('Could not check out. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  }

  if (!session) return isRestoring ? <main className="grid min-h-dvh place-items-center bg-background text-sm text-muted-foreground">Restoring your check-inÃ¢â‚¬Â¦</main> : null;

  return (
    <main className="min-h-dvh bg-background px-[22px] py-7 text-foreground md:py-10">
      <div className="mx-auto w-full max-w-[376px]">
        <section className="rounded-[24px] border border-white/10 bg-[linear-gradient(125deg,#1a1919_0%,#211715_100%)] p-5 shadow-2xl">
          <div className="flex items-center justify-between text-xs font-semibold"><span className="flex items-center gap-2"><i className="size-2 rounded-full bg-primary" />LIVE</span><time className="font-normal text-muted-foreground">{elapsed(currentUser.checkedInAt ?? session.checkedInAt, now)}</time></div>
          <div className="mt-4 flex items-center gap-3"><Avatar user={currentUser} size="size-14" /><div className="min-w-0"><p className="text-[11px] tracking-wide text-muted-foreground">YOU'RE AT</p><h1 className="truncate text-lg font-bold">{session.gymName}</h1></div></div>
          <div className="mt-5 flex h-[70px] w-full items-center gap-3 rounded-[22px] border border-white/10 bg-black/10 px-3 text-left">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[linear-gradient(135deg,#ffbd79,#e26056)] text-black"><Music2 size={20} /></span>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">No music playing</p><p className="truncate text-xs text-muted-foreground">Music sharing will be available soon</p></div>
          </div>
        </section>
        <section className="mt-7"><div className="flex items-center justify-between"><h2 className="text-base font-bold">On the floor</h2><span className="text-xs text-muted-foreground">{others.length} active</span></div>
          {error && <div role="status" className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}<Button size="icon-xs" variant="ghost" onClick={() => void refresh()} aria-label="Retry refresh"><RefreshCw /></Button></div>}
          {loading ? <p className="mt-6 text-sm text-muted-foreground">Loading the floorÃ¢â‚¬Â¦</p> : others.length === 0 ? <p className="mt-6 text-sm text-muted-foreground">You have the floor to yourself right now.</p> : <ul className="mt-3 divide-y divide-white/5">{others.map((user) => <li key={user.id} className="flex min-h-[76px] items-center gap-3 py-3"><Avatar user={user} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{user.name}</p><p className="truncate text-xs text-muted-foreground">{trackText(user)}</p></div><span className="grid size-11 shrink-0 place-items-center rounded-full border border-white/10 text-[#ffca63]" aria-hidden="true"><Music2 size={17} /></span></li>)}</ul>}
        </section>
        <Button variant="ghost" onClick={() => void handleCheckOut()} disabled={isCheckingOut} className="mt-8 w-full text-muted-foreground"><LogOut />{isCheckingOut ? 'Checking outÃ¢â‚¬Â¦' : 'Check out'}</Button>
      </div>
    </main>
  );
}
