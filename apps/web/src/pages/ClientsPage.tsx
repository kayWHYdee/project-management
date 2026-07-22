import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CreateClientDialog } from '@/features/clients/CreateClientDialog';
import { useClients } from '@/features/clients/hooks';
import { useCanWrite } from '@/features/auth/hooks';

export function ClientsPage() {
  const navigate = useNavigate();
  const canWrite = useCanWrite();
  const [search, setSearch] = useState('');
  const clients = useClients(search.trim() || undefined);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground">
            Customers and the projects you run for them.
          </p>
        </div>
        {canWrite && <CreateClientDialog />}
      </div>

      <Input
        placeholder="Search clients…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="max-w-xs"
      />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Projects</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.isPending && (
              <TableRow>
                <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {clients.data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                  No clients yet.
                </TableCell>
              </TableRow>
            )}
            {clients.data?.map((client) => (
              <TableRow
                key={client.id}
                className="cursor-pointer"
                onClick={() => navigate(`/clients/${client.id}`)}
              >
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell className="text-muted-foreground">{client.contact ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{client.phone ?? '—'}</TableCell>
                <TableCell className="text-right">{client.projectCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
