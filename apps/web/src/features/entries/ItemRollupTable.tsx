import { entryRollupKey, formatInr, type ItemRollup } from '@water-pm/shared';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Fragment, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useEntries } from './hooks';

export function ItemRollupTable({
  projectId,
  rollups,
}: {
  projectId: string;
  rollups: ItemRollup[];
}) {
  const entries = useEntries(projectId);
  const [expanded, setExpanded] = useState<string | null>(null);

  if (rollups.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Item totals appear here once you record entries.
      </p>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead className="text-right">Total qty</TableHead>
            <TableHead className="text-right">Entries</TableHead>
            <TableHead className="text-right">Total value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rollups.map((rollup) => {
            const isOpen = expanded === rollup.key;
            const behind = (entries.data ?? []).filter(
              (entry) => entryRollupKey(entry) === rollup.key,
            );
            return (
              <Fragment key={rollup.key}>
                <TableRow
                  className="cursor-pointer"
                  onClick={() => setExpanded(isOpen ? null : rollup.key)}
                >
                  <TableCell className="font-medium">
                    <span className="inline-flex items-center gap-1">
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      {rollup.name}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{rollup.totalQuantity}</TableCell>
                  <TableCell className="text-right">{rollup.entryCount}</TableCell>
                  <TableCell className="text-right">{formatInr(rollup.totalAmount)}</TableCell>
                </TableRow>
                {isOpen &&
                  behind.map((entry) => (
                    <TableRow key={entry.id} className="bg-secondary/30 text-xs">
                      <TableCell className="pl-9 text-muted-foreground">
                        {entry.systemLabel} · {entry.sentOn}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {entry.quantity} {entry.unit ?? ''}
                      </TableCell>
                      <TableCell />
                      <TableCell className="text-right text-muted-foreground">
                        {entry.amount ? formatInr(entry.amount) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
