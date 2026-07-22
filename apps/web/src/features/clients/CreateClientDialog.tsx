import { zodResolver } from '@hookform/resolvers/zod';
import { createClientRequestSchema, type CreateClientRequest } from '@water-pm/shared';
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
import { Textarea } from '@/components/ui/textarea';
import { useCreateClient } from './hooks';

export function CreateClientDialog() {
  const [open, setOpen] = useState(false);
  const createClient = useCreateClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateClientRequest>({ resolver: zodResolver(createClientRequestSchema) });

  const onSubmit = handleSubmit((values) => {
    createClient.mutate(values, {
      onSuccess: () => {
        reset();
        setOpen(false);
      },
    });
  });

  const error = createClient.error instanceof ApiError ? createClient.error.message : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add client</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add client</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field label="Name" htmlFor="name" error={errors.name?.message}>
            <Input id="name" autoFocus {...register('name')} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Contact person" htmlFor="contact" error={errors.contact?.message}>
              <Input id="contact" {...register('contact')} />
            </Field>
            <Field label="Phone" htmlFor="phone" error={errors.phone?.message}>
              <Input id="phone" {...register('phone')} />
            </Field>
          </div>
          <Field label="Email" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" {...register('email')} />
          </Field>
          <Field label="Notes" htmlFor="notes" error={errors.notes?.message}>
            <Textarea id="notes" {...register('notes')} />
          </Field>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createClient.isPending}>
              {createClient.isPending ? 'Saving…' : 'Create client'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
