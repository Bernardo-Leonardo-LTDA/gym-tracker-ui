import { useState } from "react";
import { Search, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

function findByLocation(): void {
  throw new Error("Not implemented");
}

function findByQuery(_query: string): void {
  throw new Error("Not implemented");
}

function fetchNearbyCount(): { count: number; updatedAt: string } {
  throw new Error("Not implemented");
}
void fetchNearbyCount;

export function FindScreen() {
  const [query, setQuery] = useState("");

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
              Find your gym, check in with one tap, and see who's on the floor with you.
            </p>
          </header>

          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" size={18} />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by gym name or area"
                className="h-14 pl-12 rounded-2xl bg-muted text-sm"
              />
            </div>

            <Button
              onClick={() => findByLocation()}
              className="w-full h-14 rounded-2xl text-base gap-2"
            >
              <Crosshair size={18} />
              Use my location
            </Button>

            <Button
              variant="ghost"
              onClick={() => findByQuery(query)}
              className="w-full h-12 text-muted-foreground text-sm"
            >
              Don't see your gym?
            </Button>
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
              <div>
                <p className="text-foreground font-semibold text-sm">
                  Loading...
                </p>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
