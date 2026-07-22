import { matchItems, type Item } from '@water-pm/shared';
import { useState } from 'react';
import { ApiError } from '@/lib/api';
import { useCreateItem, useItems } from '@/features/items/hooks';
import { AddItemConfirmDialog } from './AddItemConfirmDialog';
import { ItemCombobox } from './ItemCombobox';

interface ItemPickerProps {
  onSelect: (item: Item) => void;
  /** Whether the current user may add new items (any role except VIEWER). */
  canAdd: boolean;
  autoFocus?: boolean;
  placeholder?: string;
}

/**
 * Batteries-included item picker: the combobox (backed by the shared matcher)
 * plus the inline "add new item" flow with its confirmation dialog. Drop this
 * into the entry form and anywhere else an item is chosen.
 */
export function ItemPicker({ onSelect, canAdd, autoFocus, placeholder }: ItemPickerProps) {
  const items = useItems();
  const createItem = useCreateItem();
  const [pendingName, setPendingName] = useState<string | null>(null);

  const list = items.data ?? [];
  const nearMatches = pendingName ? matchItems(pendingName, list).slice(0, 3) : [];

  const confirmCreate = () => {
    if (!pendingName) return;
    createItem.mutate(
      { name: pendingName },
      {
        onSuccess: (item) => {
          onSelect(item);
          setPendingName(null);
        },
      },
    );
  };

  const pickExisting = (item: Item) => {
    onSelect(item);
    setPendingName(null);
  };

  return (
    <>
      <ItemCombobox
        items={list}
        onSelect={onSelect}
        onRequestAdd={canAdd ? setPendingName : undefined}
        autoFocus={autoFocus}
        placeholder={placeholder}
      />
      <AddItemConfirmDialog
        name={pendingName}
        nearMatches={nearMatches}
        pending={createItem.isPending}
        error={createItem.error instanceof ApiError ? createItem.error.message : null}
        onPickExisting={pickExisting}
        onConfirm={confirmCreate}
        onCancel={() => setPendingName(null)}
      />
    </>
  );
}
