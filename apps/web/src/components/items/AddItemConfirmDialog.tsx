import type { Item } from '@water-pm/shared';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface AddItemConfirmDialogProps {
  name: string | null;
  nearMatches: Item[];
  pending: boolean;
  error?: string | null;
  onPickExisting: (item: Item) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Deliberate mild friction before creating a new item: shows the exact name as
 * typed and any near matches ("did you mean…?") so a typo doesn't silently
 * create a duplicate.
 */
export function AddItemConfirmDialog({
  name,
  nearMatches,
  pending,
  error,
  onPickExisting,
  onConfirm,
  onCancel,
}: AddItemConfirmDialogProps) {
  return (
    <Dialog open={name !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a new item?</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm">
            This will create a new catalog item named{' '}
            <span className="font-semibold">“{name}”</span>.
          </p>

          {nearMatches.length > 0 && (
            <div className="rounded-md border bg-secondary/40 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Did you mean:</p>
              <div className="flex flex-wrap gap-2">
                {nearMatches.map((item) => (
                  <Button
                    key={item.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onPickExisting(item)}
                  >
                    {item.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="button" onClick={onConfirm} disabled={pending}>
              {pending ? 'Creating…' : 'Create item'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
