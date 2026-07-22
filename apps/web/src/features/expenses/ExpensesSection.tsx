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
import { AddExpenseDialog } from './AddExpenseDialog';
import { useDeleteExpense, useExpenses } from './hooks';

export function ExpensesSection({ projectId, canWrite }: { projectId: string; canWrite: boolean }) {
  const expenses = useExpenses(projectId);
  const deleteExpense = useDeleteExpense(projectId);
  const deleteError = deleteExpense.error instanceof ApiError ? deleteExpense.error.message : null;

  const onDelete = (id: string) => {
    if (window.confirm('Delete this expense?')) deleteExpense.mutate(id);
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Expenses ({expenses.data?.length ?? 0})</h2>
        {canWrite && <AddExpenseDialog projectId={projectId} />}
      </div>

      {deleteError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {deleteError}
        </p>
      )}

      {expenses.data?.length === 0 && !expenses.isPending ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No expenses recorded.
        </p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Spent on</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                {canWrite && <TableHead />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.data?.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">{expense.category}</TableCell>
                  <TableCell className="text-muted-foreground">{expense.note ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{expense.spentOn}</TableCell>
                  <TableCell className="text-right">{formatInr(expense.amount)}</TableCell>
                  {canWrite && (
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(expense.id)}
                        aria-label="Delete expense"
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
