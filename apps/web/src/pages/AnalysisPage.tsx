import {
  formatInr,
  humaniseSystemType,
  type AnalysisFilters,
  type Item,
  type SystemType,
} from '@water-pm/shared';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { downloadCsv } from '@/lib/csv';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { StatTile } from '@/components/ui/stat-tile';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ItemCombobox } from '@/components/items/ItemCombobox';
import { PROJECT_STATUSES, projectStatusLabel } from '@/lib/project-status';
import { useAnalysis } from '@/features/analysis/hooks';
import { useClients } from '@/features/clients/hooks';
import { useItems } from '@/features/items/hooks';

const SYSTEM_TYPES: SystemType[] = [
  'POOL',
  'FOUNTAIN',
  'RO',
  'STP',
  'WTP',
  'SPARES',
  'CONSUMABLES',
];

const EMPTY: AnalysisFilters = {};

export function AnalysisPage() {
  const navigate = useNavigate();
  const items = useItems(true);
  const clients = useClients();
  const [item, setItem] = useState<Item | null>(null);
  const [filters, setFilters] = useState<AnalysisFilters>(EMPTY);

  const active: AnalysisFilters = {
    clientId: filters.clientId || undefined,
    status: filters.status || undefined,
    systemType: filters.systemType || undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
  };
  const analysis = useAnalysis(item?.id ?? null, active);
  const result = analysis.data;

  const exportCsv = () => {
    if (!result || !item) return;
    const rows = result.rows.map((row) => [
      row.projectName,
      row.clientName,
      row.systemLabel,
      humaniseSystemType(row.systemType),
      row.description ?? '',
      `${row.quantity} ${row.unit ?? ''}`.trim(),
      row.sentOn,
      row.amount ?? '',
    ]);
    downloadCsv(
      `analysis-${item.name.replace(/\s+/g, '-').toLowerCase()}.csv`,
      ['Project', 'Client', 'System', 'Type', 'Description', 'Quantity', 'Sent on', 'Amount'],
      rows,
    );
  };

  const set = (key: keyof AnalysisFilters, value: string) =>
    setFilters((f) => ({ ...f, [key]: value }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analysis</h1>
        <p className="text-sm text-muted-foreground">
          Pick an item to see everywhere it has been sent, across all projects.
        </p>
      </div>

      <div className="max-w-md">
        <ItemCombobox
          items={items.data ?? []}
          onSelect={setItem}
          placeholder="Choose an item to analyse…"
        />
      </div>

      {item && (
        <>
          <div className="flex flex-wrap gap-2">
            <Select
              className="max-w-44"
              value={filters.clientId ?? ''}
              onChange={(e) => set('clientId', e.target.value)}
            >
              <option value="">All clients</option>
              {clients.data?.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </Select>
            <Select
              className="max-w-44"
              value={filters.status ?? ''}
              onChange={(e) => set('status', e.target.value)}
            >
              <option value="">All statuses</option>
              {PROJECT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {projectStatusLabel(status)}
                </option>
              ))}
            </Select>
            <Select
              className="max-w-44"
              value={filters.systemType ?? ''}
              onChange={(e) => set('systemType', e.target.value)}
            >
              <option value="">All system types</option>
              {SYSTEM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {humaniseSystemType(type)}
                </option>
              ))}
            </Select>
            <Input
              type="date"
              className="max-w-40"
              value={filters.from ?? ''}
              onChange={(e) => set('from', e.target.value)}
            />
            <Input
              type="date"
              className="max-w-40"
              value={filters.to ?? ''}
              onChange={(e) => set('to', e.target.value)}
            />
            <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY)}>
              Clear filters
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatTile
              size="lg"
              label="Total quantity"
              value={result?.summary.totalQuantity ?? '—'}
            />
            <StatTile
              size="lg"
              label="Projects"
              value={String(result?.summary.projectCount ?? '—')}
            />
            <StatTile
              size="lg"
              label="Total value"
              value={result ? formatInr(result.summary.totalValue) : '—'}
            />
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">
              {item.name} — {result?.rows.length ?? 0} entr
              {result?.rows.length === 1 ? 'y' : 'ies'}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={exportCsv}
              disabled={!result || result.rows.length === 0}
            >
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>System</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Sent on</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysis.isPending && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                      Loading…
                    </TableCell>
                  </TableRow>
                )}
                {result?.rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                      No entries for this item with the current filters.
                    </TableCell>
                  </TableRow>
                )}
                {result?.rows.map((row) => (
                  <TableRow
                    key={row.entryId}
                    className="cursor-pointer"
                    onClick={() => navigate(`/projects/${row.projectId}`)}
                  >
                    <TableCell className="font-medium">
                      {row.projectName}
                      <span className="block text-xs text-muted-foreground">{row.clientName}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.systemLabel}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.description ?? '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.quantity} {row.unit ?? ''}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.sentOn}</TableCell>
                    <TableCell className="text-right">
                      {row.amount ? formatInr(row.amount) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
