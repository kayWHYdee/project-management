import type { ManagedItem } from '@water-pm/shared';
import { useState } from 'react';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { useMergeItem } from './hooks';

interface MergeItemDialogProps {
  source: ManagedItem;
  items: ManagedItem[];
  onClose: () => void;
}

export function MergeItemDialog({ source, items, onClose }: MergeItemDialogProps) {
  const mergeItem = useMergeItem();
  const [targetId, setTargetId] = useState('');
  const targets = items.filter((item) => item.id !== source.id && item.isActive);
  const target = targets.find((item) => item.id === targetId);

  const onMerge = () => {
    if (!targetId) return;
    mergeItem.mutate({ id: source.id, targetItemId: targetId }, { onSuccess: onClose });
  };

  const error = mergeItem.error instanceof ApiError ? mergeItem.error.message : null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Merge “{source.name}” into another item</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Merge into" htmlFor="merge-target">
            <Select
              id="merge-target"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              autoFocus
            >
              <option value="">Choose an item…</option>
              {targets.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>

          <p className="rounded-md bg-secondary/40 p-3 text-sm">
            This moves <span className="font-semibold">{source.usageCount}</span>{' '}
            {source.usageCount === 1 ? 'entry' : 'entries'} from{' '}
            <span className="font-semibold">{source.name}</span>
            {target ? (
              <>
                {' '}
                to <span className="font-semibold">{target.name}</span>
              </>
            ) : null}{' '}
            and deactivates <span className="font-semibold">{source.name}</span>. This cannot be
            undone automatically.
          </p>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onMerge}
              disabled={!targetId || mergeItem.isPending}
            >
              {mergeItem.isPending ? 'Merging…' : 'Merge'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
