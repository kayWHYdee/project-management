import { zodResolver } from '@hookform/resolvers/zod';
import {
  createPaymentRequestSchema,
  todayIsoDate,
  type CreatePaymentRequest,
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
import { useCreatePayment } from './hooks';

export function AddPaymentDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const createPayment = useCreatePayment(projectId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePaymentRequest>({
    resolver: zodResolver(createPaymentRequestSchema),
    defaultValues: { receivedOn: todayIsoDate() },
  });

  const onSubmit = handleSubmit((values) => {
    createPayment.mutate(values, {
      onSuccess: () => {
        reset({ receivedOn: todayIsoDate() });
        setOpen(false);
      },
    });
  });

  const error = createPayment.error instanceof ApiError ? createPayment.error.message : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add payment</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add payment received</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount (₹)" htmlFor="pay-amount" error={errors.amount?.message}>
              <Input id="pay-amount" inputMode="decimal" autoFocus {...register('amount')} />
            </Field>
            <Field label="Received on" htmlFor="pay-date" error={errors.receivedOn?.message}>
              <Input id="pay-date" type="date" {...register('receivedOn')} />
            </Field>
          </div>
          <Field label="Note (optional)" htmlFor="pay-note" error={errors.note?.message}>
            <Input id="pay-note" {...register('note')} />
          </Field>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createPayment.isPending}>
              {createPayment.isPending ? 'Saving…' : 'Add payment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
