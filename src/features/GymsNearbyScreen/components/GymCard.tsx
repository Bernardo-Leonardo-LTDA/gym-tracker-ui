import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Gym } from '../types';

type GymCardProps = {
  gym: Gym;
  activeCount: number;
  isChecking: boolean;
  isCheckedIn: boolean;
  onCheckIn: (gym: Gym) => void;
};

export function GymCard({
  gym,
  activeCount,
  isChecking,
  isCheckedIn,
  onCheckIn,
}: GymCardProps) {
  return (
    <Card className="flex-row items-stretch gap-0 rounded-3xl py-0">
      <div
        className="relative w-28 shrink-0"
        style={{ backgroundImage: gym.photo }}
        aria-hidden
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/80" />
      </div>

      <div className="min-w-0 flex-1 py-4 pl-4 pr-1">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
          <span className="truncate">{gym.area}</span>
          <span className="shrink-0">·</span>
          <span className="shrink-0">{gym.distance}</span>
        </div>
        <h3 className="mt-1 truncate font-semibold text-foreground">
          {gym.name}
        </h3>
        <div className="mt-2 flex items-center gap-2">
          <span className="relative flex size-2 shrink-0" aria-hidden>
            <span className="absolute inset-0 rounded-full bg-primary opacity-60 blur-md" />
            <span className="relative size-2 animate-pulse rounded-full bg-primary" />
          </span>
          <span className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{activeCount}</span>{' '}
            lifting now
          </span>
        </div>
      </div>

      <Button
        onClick={() => onCheckIn(gym)}
        disabled={isChecking || isCheckedIn}
        className="m-3 h-auto min-w-[88px] self-stretch rounded-2xl font-semibold"
      >
        {isChecking ? '…' : isCheckedIn ? 'Done' : 'Check in'}
      </Button>
    </Card>
  );
}
