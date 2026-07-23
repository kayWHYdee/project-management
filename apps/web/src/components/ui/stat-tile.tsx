import { cn } from '@/lib/utils';

interface StatTileProps {
  label: string;
  value: string;
  /** `lg` for headline dashboard stats, `md` (default) for detail tiles. */
  size?: 'md' | 'lg';
  /** Render the value in the destructive colour (e.g. a negative remaining balance). */
  highlight?: boolean;
}

/** A bordered label + value tile — the app's one summary-stat primitive. */
export function StatTile({ label, value, size = 'md', highlight }: StatTileProps) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-1 font-semibold',
          size === 'lg' ? 'text-2xl' : 'text-lg',
          highlight && 'text-destructive',
        )}
      >
        {value}
      </p>
    </div>
  );
}
