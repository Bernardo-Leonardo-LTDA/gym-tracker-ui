import { useState } from 'react';
import { Search, Crosshair } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Equalizer } from './Equalizer';
import { gymsApi, type SearchCoordinates } from './api';

function findByLocation(): Promise<SearchCoordinates> {
  if (!navigator.geolocation) {
    return Promise.reject(
      new Error('Location is not supported by this device.')
    );
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve({
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
      () => reject(new Error('Unable to access your location.')),
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  });
}

function findByAddress(address: string) {
  return gymsApi.search(address);
}

function fetchNearbyCount(): { count: number; updatedAt: string } {
  return {
    count: 2,
    updatedAt: 'just now',
  };
}

export function FindScreen() {
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState<SearchCoordinates | null>(
    null
  );
  const [isSearching, setIsSearching] = useState(false);
  const [feedback, setFeedback] = useState<{
    message: string;
    isError: boolean;
  } | null>(null);
  const trimmedAddress = address.trim();
  const nearby = fetchNearbyCount();

  async function handleFind(): Promise<void> {
    setIsSearching(true);
    setFeedback(null);

    try {
      if (trimmedAddress) {
        const gyms = await findByAddress(trimmedAddress);
        setFeedback({
          message: `${gyms.length} ${gyms.length === 1 ? 'gym' : 'gyms'} found near this address.`,
          isError: false,
        });
        return;
      }

      const currentCoordinates = coordinates ?? (await findByLocation());
      setCoordinates(currentCoordinates);
      const gyms = await gymsApi.nearby(currentCoordinates);
      setFeedback({
        message: `${gyms.length} ${gyms.length === 1 ? 'gym' : 'gyms'} found nearby.`,
        isError: false,
      });
    } catch (error) {
      setFeedback({
        message:
          error instanceof Error ? error.message : 'Something went wrong.',
        isError: true,
      });
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center md:py-10">
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
                role="status"
                className={`px-2 text-center text-xs ${
                  feedback.isError
                    ? 'text-destructive'
                    : 'text-muted-foreground'
                }`}
              >
                {feedback.message}
              </p>
            )}
          </div>

          <div className="mt-12">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
              Live right now
            </p>
            <Card className="p-5 flex-row items-center gap-4">
              <div className="relative shrink-0">
                <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
                <div className="absolute inset-0 h-3 w-3 rounded-full bg-primary blur-md opacity-60" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-foreground font-semibold text-sm">
                  {nearby.count} lifters checked in nearby
                </p>
                <p className="text-muted-foreground text-xs">
                  Updated {nearby.updatedAt}
                </p>
              </div>
              <Equalizer />
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
