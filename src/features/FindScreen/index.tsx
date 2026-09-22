import { useState } from 'react';
import { Search, Crosshair } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { gymsApi, type SearchCoordinates } from './api';
import { getFindErrorMessage } from './utils';

function findByLocation(): Promise<SearchCoordinates> {
  if (!navigator.geolocation) {
    return Promise.reject(
      new Error(
        'Location is unavailable. Allow location access and use HTTPS or localhost.'
      )
    );
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve({
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
      (error) => {
        const message =
          error.code === 1
            ? 'Location permission was denied. Allow location access and try again.'
            : error.code === 3
              ? 'Getting your location timed out. Please try again.'
              : 'Unable to access your location. Please try again.';
        reject(new Error(message));
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 }
    );
  });
}

function findByAddress(address: string) {
  return gymsApi.search(address);
}

export function FindScreen() {
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const trimmedAddress = address.trim();
  async function handleFind(): Promise<void> {
    setIsSearching(true);
    setFeedback(null);

    try {
      if (trimmedAddress) {
        const gyms = await findByAddress(trimmedAddress);
        navigate('/nearby', { state: { gyms, address: trimmedAddress } });
        return;
      }

      const currentCoordinates = await findByLocation();
      const gyms = await gymsApi.nearby(currentCoordinates);
      navigate('/nearby', { state: { gyms, address: 'Current location' } });
    } catch (error) {
      setFeedback(getFindErrorMessage(error, Boolean(trimmedAddress)));
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="min-h-dvh w-full bg-background flex items-center justify-center md:py-10">
      <div className="w-full md:max-w-lg md:rounded-3xl md:border md:border-border md:shadow-2xl bg-background">
        <section className="px-6 pt-8 pb-12">
          <header className="mb-10">
            <h1 className="mt-4 text-4xl font-bold leading-[1.05] text-foreground">
              Who's lifting <br />
              <span className="text-primary">with you</span> right now.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground max-w-[28ch]">
              Find your gym, check in with one tap, and see who's on the floor
              with you.
            </p>
          </header>

          <div className="space-y-3">
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground"
                size={18}
              />
              <Input
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setFeedback(null);
                }}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return;
                  e.preventDefault();
                  if (trimmedAddress && !isSearching) void handleFind();
                }}
                placeholder="Search by address or area"
                className="h-14 pl-12 rounded-2xl bg-muted text-sm"
              />
            </div>

            <Button
              onClick={handleFind}
              disabled={isSearching}
              title={
                trimmedAddress ? `Search near “${trimmedAddress}”` : undefined
              }
              className="w-full min-w-0 h-14 overflow-hidden rounded-2xl text-base gap-2"
            >
              {trimmedAddress ? <Search size={18} /> : <Crosshair size={18} />}
              <span className="min-w-0 truncate">
                {isSearching
                  ? trimmedAddress
                    ? 'Searching...'
                    : 'Getting location...'
                  : trimmedAddress
                    ? `Search near “${trimmedAddress}”`
                    : 'Use my location'}
              </span>
            </Button>

            {feedback && (
              <p
                role="alert"
                className="px-2 text-center text-xs text-destructive"
              >
                {feedback}
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
