export function Equalizer() {
  return (
    <div className="flex h-6 shrink-0 items-end gap-[3px]" aria-hidden="true">
      {[0, 1, 2, 3].map((bar) => (
        <span
          key={bar}
          className="equalizer-bar h-full w-[3px] rounded-sm bg-accent"
          style={{ animationDelay: `${bar * 0.12}s` }}
        />
      ))}
    </div>
  );
}
