import type { Item, ManagedItem } from '@water-pm/shared';
import { useState } from 'react';
import { ApiError } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ItemPicker } from '@/components/items/ItemPicker';
import { EditItemDialog } from '@/features/items/EditItemDialog';
import { MergeItemDialog } from '@/features/items/MergeItemDialog';
import { useManagedItems, useUpdateItem } from '@/features/items/hooks';
import { useCanWrite } from '@/features/auth/hooks';

export function ItemsPage() {
  const canWrite = useCanWrite();
  const items = useManagedItems();
  const updateItem = useUpdateItem();
  const [selected, setSelected] = useState<Item | null>(null);
  const [editing, setEditing] = useState<ManagedItem | null>(null);
  const [merging, setMerging] = useState<ManagedItem | null>(null);

  const toggleActive = (item: ManagedItem) =>
    updateItem.mutate({ id: item.id, body: { isActive: !item.isActive } });

  const actionError = updateItem.error instanceof ApiError ? updateItem.error.message : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Items</h1>
        <p className="text-sm text-muted-foreground">
          The global catalog used when recording entries. Rename, recategorise, deactivate or merge
          items here — renaming happens only on this screen.
        </p>
      </div>

      {canWrite && (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle className="text-base">Find or add an item</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ItemPicker onSelect={setSelected} canAdd={canWrite} placeholder="e.g. well pu…" />
            {selected && (
              <p className="text-sm text-muted-foreground">
                Selected: <span className="font-medium text-foreground">{selected.name}</span>
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {actionError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      )}

      <div>
        <h2 className="mb-2 text-sm font-medium">Catalog ({items.data?.length ?? 0})</h2>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Usage</TableHead>
                <TableHead>Status</TableHead>
                {canWrite && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.isPending && (
                <TableRow>
                  <TableCell
                    colSpan={canWrite ? 5 : 4}
                    className="py-6 text-center text-muted-foreground"
                  >
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {items.data?.map((item) => (
                <TableRow key={item.id} className={item.isActive ? undefined : 'opacity-60'}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="muted">{item.category.toLowerCase()}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{item.usageCount}</TableCell>
                  <TableCell>
                    {item.isActive ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="muted">Inactive</Badge>
                    )}
                  </TableCell>
                  {canWrite && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditing(item)}>
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setMerging(item)}
                          disabled={item.usageCount === 0}
                        >
                          Merge
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActive(item)}
                          disabled={updateItem.isPending}
                        >
                          {item.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {editing && (
        <EditItemDialog key={editing.id} item={editing} onClose={() => setEditing(null)} />
      )}
      {merging && (
        <MergeItemDialog
          key={merging.id}
          source={merging}
          items={items.data ?? []}
          onClose={() => setMerging(null)}
        />
      )}
    </div>
  );
}
