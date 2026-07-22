import type { Item } from '@water-pm/shared';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
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
import { useItems } from '@/features/items/hooks';
import { useCanWrite } from '@/features/auth/hooks';

export function ItemsPage() {
  const canWrite = useCanWrite();
  const items = useItems();
  const [selected, setSelected] = useState<Item | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Items</h1>
        <p className="text-sm text-muted-foreground">
          The global catalog used when recording entries. Type to search;{' '}
          {canWrite ? 'add' : 'ask an editor to add'} anything missing.
        </p>
      </div>

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

      <div>
        <h2 className="mb-2 text-sm font-medium">Catalog ({items.data?.length ?? 0})</h2>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.isPending && (
                <TableRow>
                  <TableCell colSpan={2} className="py-6 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {items.data?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="muted">{item.category.toLowerCase()}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
