import { zodResolver } from '@hookform/resolvers/zod';
import {
  createExpenseRequestSchema,
  todayIsoDate,
  type CreateExpenseRequest,
} from '@water-pm/shared';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useCreateExpense } from './hooks';

const CATEGORIES = ['Labour', 'Transport', 'Sub-contractor', 'Misc'];

export function AddExpenseDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const createExpense = useCreateExpense(projectId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateExpenseRequest>({
    resolver: zodResolver(createExpenseRequestSchema),
    defaultValues: { category: 'Labour', spentOn: todayIsoDate() },
  });

  const onSubmit = handleSubmit((values) => {
    createExpense.mutate(values, {
      onSuccess: () => {
        reset({ category: 'Labour', spentOn: todayIsoDate() });
        setOpen(false);
      },
    });
  });

  const error = createExpense.error instanceof ApiError ? createExpense.error.message : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Add expense
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field label="Category" htmlFor="category" error={errors.category?.message}>
            <Select id="category" {...register('category')}>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount (₹)" htmlFor="amount" error={errors.amount?.message}>
              <Input id="amount" inputMode="decimal" autoFocus {...register('amount')} />
            </Field>
            <Field label="Spent on" htmlFor="spentOn" error={errors.spentOn?.message}>
              <Input id="spentOn" type="date" {...register('spentOn')} />
            </Field>
          </div>
          <Field label="Note (optional)" htmlFor="note" error={errors.note?.message}>
            <Input id="note" {...register('note')} />
          </Field>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createExpense.isPending}>
              {createExpense.isPending ? 'Saving…' : 'Add expense'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
