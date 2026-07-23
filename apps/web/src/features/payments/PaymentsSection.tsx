import { formatInr } from '@water-pm/shared';
import { Trash2 } from 'lucide-react';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AddPaymentDialog } from './AddPaymentDialog';
import { useDeletePayment, usePayments } from './hooks';

export function PaymentsSection({ projectId, canWrite }: { projectId: string; canWrite: boolean }) {
  const payments = usePayments(projectId);
  const deletePayment = useDeletePayment(projectId);
  const deleteError = deletePayment.error instanceof ApiError ? deletePayment.error.message : null;

  const onDelete = (id: string) => {
    if (window.confirm('Delete this payment?')) deletePayment.mutate(id);
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Payments received ({payments.data?.length ?? 0})</h2>
        {canWrite && <AddPaymentDialog projectId={projectId} />}
      </div>

      {deleteError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {deleteError}
        </p>
      )}

      {payments.data?.length === 0 && !payments.isPending ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No payments recorded.
        </p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Received on</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                {canWrite && <TableHead />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.data?.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="text-muted-foreground">{payment.receivedOn}</TableCell>
                  <TableCell className="text-muted-foreground">{payment.note ?? '—'}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatInr(payment.amount)}
                  </TableCell>
                  {canWrite && (
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(payment.id)}
                        aria-label="Delete payment"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
