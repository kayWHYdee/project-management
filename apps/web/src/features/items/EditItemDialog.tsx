import type { ItemCategory, ManagedItem } from '@water-pm/shared';
import { useState } from 'react';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useUpdateItem } from './hooks';

const CATEGORIES: ItemCategory[] = [
  'MECHANICAL',
  'ELECTRICAL',
  'CHEMICAL',
  'MEDIA',
  'FITTINGS',
  'OTHER',
];

export function EditItemDialog({ item, onClose }: { item: ManagedItem; onClose: () => void }) {
  const updateItem = useUpdateItem();
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState<ItemCategory>(item.category);
  const [isActive, setIsActive] = useState(item.isActive);

  const onSave = () => {
    updateItem.mutate(
      { id: item.id, body: { name: name.trim(), category, isActive } },
      { onSuccess: onClose },
    );
  };

  const error = updateItem.error instanceof ApiError ? updateItem.error.message : null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit item</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Name" htmlFor="item-name">
            <Input
              id="item-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </Field>
          <Field label="Category" htmlFor="item-category">
            <Select
              id="item-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ItemCategory)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.toLowerCase()}
                </option>
              ))}
            </Select>
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Active (uncheck to hide from the item picker; history is kept)
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" onClick={onSave} disabled={updateItem.isPending || !name.trim()}>
              {updateItem.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
