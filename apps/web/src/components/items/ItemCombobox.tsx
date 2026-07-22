import { matchItems, type Item } from '@water-pm/shared';
import { Plus } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const MAX_VISIBLE = 8;

interface ItemComboboxProps {
  items: Item[];
  onSelect: (item: Item) => void;
  /** When provided, an inline "+ Add" option appears for an unknown query. */
  onRequestAdd?: (name: string) => void;
  autoFocus?: boolean;
  placeholder?: string;
}

export function ItemCombobox({
  items,
  onSelect,
  onRequestAdd,
  autoFocus,
  placeholder = 'Search items…',
}: ItemComboboxProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trimmed = query.trim();
  const matches = useMemo(() => matchItems(query, items).slice(0, MAX_VISIBLE), [query, items]);
  const exactExists = useMemo(
    () => items.some((item) => item.name.toLowerCase().trim() === trimmed.toLowerCase()),
    [items, trimmed],
  );
  const showAdd = !!onRequestAdd && trimmed !== '' && !exactExists;
  const optionCount = matches.length + (showAdd ? 1 : 0);

  const choose = (index: number) => {
    if (index < matches.length) {
      const item = matches[index];
      if (item) {
        onSelect(item);
        setQuery(item.name);
      }
    } else if (showAdd) {
      onRequestAdd?.(trimmed);
    }
    setOpen(false);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      setOpen(true);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlight((h) => Math.min(h + 1, optionCount - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (optionCount > 0) choose(highlight);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <Input
        value={query}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
      />

      {open && optionCount > 0 && (
        <ul
          className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-md border bg-card p-1 shadow-md"
          onMouseDown={(event) => {
            // Keep focus on the input so the click registers before blur closes the list.
            event.preventDefault();
            if (blurTimer.current) clearTimeout(blurTimer.current);
          }}
        >
          {matches.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                className={cn(
                  'flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm',
                  index === highlight ? 'bg-secondary' : 'hover:bg-secondary/60',
                )}
                onMouseEnter={() => setHighlight(index)}
                onClick={() => choose(index)}
              >
                <span>{item.name}</span>
                <span className="text-xs text-muted-foreground">{item.category.toLowerCase()}</span>
              </button>
            </li>
          ))}
          {showAdd && (
            <li>
              <button
                type="button"
                className={cn(
                  'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm',
                  highlight === matches.length ? 'bg-secondary' : 'hover:bg-secondary/60',
                )}
                onMouseEnter={() => setHighlight(matches.length)}
                onClick={() => choose(matches.length)}
              >
                <Plus className="h-4 w-4" />
                Add “{trimmed}” as a new item
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
