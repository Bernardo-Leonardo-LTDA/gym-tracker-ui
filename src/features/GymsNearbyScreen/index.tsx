import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GymCard } from './components/GymCard';
import {
  checkIn,
  fetchCheckedInUserCounts,
  getStoredUserId,
  getStoredUserName,
  saveActiveSession,
} from './services';
import { STORAGE_USER_ID_KEY, STORAGE_USER_NAME_KEY } from './types';
import type { Gym, PlacesApiPlace } from './types';
import { getRequestErrorMessage, toGyms } from './utils';

type LocationState = { gyms?: (Gym | PlacesApiPlace)[]; address?: string };
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function GymsNearbyScreen() {
  const navigate = useNavigate();
  const location = useLocation() as { state: LocationState | null };
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeCounts, setActiveCounts] = useState<Record<string, number>>({});
  const gyms = useMemo(
    () => toGyms(location.state?.gyms, []),
    [location.state?.gyms]
  );
  useEffect(() => {
    let cancelled = false;

    void fetchCheckedInUserCounts(gyms.map((gym) => gym.id))
      .then((counts) => {
        if (!cancelled) setActiveCounts(counts);
      })
      .catch(() => {
        if (!cancelled) setActiveCounts({});
      });

    return () => {
      cancelled = true;
    };
  }, [gyms]);

  function goBack(): void {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/');
  }

  async function handleCheckIn(gym: Gym): Promise<void> {
    setError(null);
    setCheckingId(gym.id);
    try {
      const user = getCheckInUser();
      if (!user) return;
      const checkedInUser = await checkIn({ gymId: gym.id, ...user });
      if (!checkedInUser.checkedInAt) {
        throw new Error('Check-in time was not returned. Please try again.');
      }
      persistUser(checkedInUser.id, checkedInUser.name);
      saveActiveSession({
        gymId: gym.id,
        gymName: gym.name,
        userId: checkedInUser.id,
        userName: checkedInUser.name,
        checkedInAt: checkedInUser.checkedInAt,
      });
      navigate('/active');
    } catch (checkInError) {
      setError(getRequestErrorMessage(checkInError));
    } finally {
      setCheckingId(null);
    }
  }

  function getCheckInUser(): { userId: string | null; userName: string } | null {
    let userId = getStoredUserId();
    let userName = getStoredUserName();
    if (userId && !UUID_RE.test(userId)) {
      setError('Your saved user ID is invalid. Clear site data and try again.');
      return null;
    }
    if (!userName) {
      userName = window.prompt('Enter your name to check in:')?.trim() ?? '';
      if (!userName) {
        setError('Name is required to check in.');
        return null;
      }
    }
    return { userId, userName };
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background md:py-10">
      <div className="w-full bg-background md:max-w-lg md:rounded-3xl md:border md:border-border md:shadow-2xl">
        <section className="px-6 pb-12 pt-8">
          <header className="mb-8">
            <div className="mb-8 flex items-center justify-between">
              <Button
                variant="outline"
                size="icon"
                onClick={goBack}
                className="rounded-full"
                aria-label="Back"
              >
                <ArrowLeft size={18} />
              </Button>
              <span className="max-w-[16rem] truncate text-xs uppercase tracking-wider text-muted-foreground">
                {location.state?.address ?? 'Nearby'}
              </span>
              <div className="size-10" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Nearby gyms</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tap a gym to check in.
            </p>
          </header>
          {error && (
            <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {gyms.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-border bg-muted/40 px-4 py-5 text-sm text-muted-foreground">
              No gyms were found. Go back and try another search.
            </div>
          ) : <ul className="mt-5 space-y-3">
            {gyms.map((gym) => (
              <li key={gym.id}>
                <GymCard
                  gym={gym}
                  activeCount={activeCounts[gym.id] ?? gym.active}
                  isChecking={checkingId === gym.id}
                  isCheckedIn={false}
                  onCheckIn={handleCheckIn}
                />
              </li>
            ))}
          </ul>}
        </section>
      </div>
    </div>
  );
}

function persistUser(userId: string, userName: string): void {
  try {
    localStorage.setItem(STORAGE_USER_ID_KEY, userId);
    localStorage.setItem(STORAGE_USER_NAME_KEY, userName);
  } catch {
    // Ignore unavailable storage.
  }
}
