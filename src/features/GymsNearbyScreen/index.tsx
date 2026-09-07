import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GymCard } from './components/GymCard';
import {
  checkIn,
  fetchCheckedUsersInMyGym,
  getStoredUserId,
  getStoredUserName,
} from './services/gyms.service';
import { STORAGE_USER_ID_KEY, STORAGE_USER_NAME_KEY } from './types';
import type { Gym, PlacesApiPlace, User } from './types';
import { filterGyms, getRequestErrorMessage, toGyms } from './utils';

const FALLBACK_GYMS: Gym[] = [
  {
    id: 'ironworks',
    name: 'Ironworks Climbing Gym',
    area: 'Mission District',
    distance: '0.2 mi',
    active: 14,
    photo: 'linear-gradient(135deg, #2b2320, #14100e)',
  },
  {
    id: 'barbell',
    name: 'Barbell & Strength Co.',
    area: 'SOMA',
    distance: '0.6 mi',
    active: 7,
    photo: 'linear-gradient(135deg, #2a1a1c, #140d0e)',
  },
  {
    id: 'powerhouse',
    name: 'Powerhouse Gym SF',
    area: 'Castro',
    distance: '1.1 mi',
    active: 22,
    photo: 'linear-gradient(135deg, #1f242a, #0f1114)',
  },
  {
    id: 'fortitude',
    name: 'Fortitude Strength Club',
    area: 'Hayes Valley',
    distance: '1.4 mi',
    active: 3,
    photo: 'linear-gradient(135deg, #212a29, #101413)',
  },
];

type LocationState = { gyms?: (Gym | PlacesApiPlace)[]; address?: string };
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function GymsNearbyScreen() {
  const navigate = useNavigate();
  const location = useLocation() as { state: LocationState | null };
  const [query, setQuery] = useState('');
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [checkedInGymId, setCheckedInGymId] = useState<string | null>(null);
  const [checkedUsers, setCheckedUsers] = useState<User[]>([]);
  const gyms = toGyms(location.state?.gyms, FALLBACK_GYMS);
  const filteredGyms = filterGyms(gyms, query);

  function goBack(): void {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/');
  }

  async function handleCheckIn(gym: Gym): Promise<void> {
    setError(null);
    setSuccessId(null);
    setCheckingId(gym.id);
    try {
      const user = getCheckInUser();
      if (!user) return;
      const checkedInUser = await checkIn({ gymId: gym.id, ...user });
      const currentGymUsers = await fetchCheckedUsersInMyGym(
        gym.id,
        checkedInUser.id
      );
      setSuccessId(gym.id);
      setCheckedInGymId(gym.id);
      setCheckedUsers(currentGymUsers);
    } catch (checkInError) {
      setError(getRequestErrorMessage(checkInError));
    } finally {
      setCheckingId(null);
    }
  }

  function getCheckInUser(): { userId: string; userName: string } | null {
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
    userId ??= uuidv4();
    persistUser(userId, userName);
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
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter results"
            className="h-12 rounded-2xl bg-muted text-sm"
          />
          {error && (
            <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {successId && (
            <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
              Checked in successfully!
            </div>
          )}
          <ul className="mt-5 space-y-3">
            {filteredGyms.map((gym) => (
              <li key={gym.id}>
                <GymCard
                  gym={gym}
                  activeCount={
                    checkedInGymId === gym.id ? checkedUsers.length : gym.active
                  }
                  isChecking={checkingId === gym.id}
                  isCheckedIn={successId === gym.id}
                  onCheckIn={handleCheckIn}
                />
                {checkedInGymId === gym.id && (
                  <section className="mt-3 rounded-2xl border border-border bg-muted/40 p-4">
                    <h2 className="text-sm font-semibold text-foreground">
                      Lifting with you
                    </h2>
                    <ul className="mt-3 space-y-2">
                      {checkedUsers.map((checkedUser) => (
                        <li
                          key={checkedUser.id}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <span className="truncate font-medium text-foreground">
                            {checkedUser.name}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {checkedUser.currentSongTitle
                              ? `${checkedUser.currentSongTitle} — ${checkedUser.currentSongArtist ?? 'Unknown artist'}`
                              : 'No music playing'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </li>
            ))}
          </ul>
          {filteredGyms.length === 0 && (
            <p className="mt-12 text-center text-sm text-muted-foreground">
              No gyms match &quot;{query}&quot;.
            </p>
          )}
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
