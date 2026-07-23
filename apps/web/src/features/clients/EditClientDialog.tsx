import { zodResolver } from '@hookform/resolvers/zod';
import { updateClientRequestSchema, type Client, type UpdateClientRequest } from '@water-pm/shared';
import { useForm } from 'react-hook-form';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateClient } from './hooks';

export function EditClientDialog({ client, onClose }: { client: Client; onClose: () => void }) {
  const updateClient = useUpdateClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateClientRequest>({
    resolver: zodResolver(updateClientRequestSchema),
    defaultValues: {
      name: client.name,
      contact: client.contact ?? '',
      phone: client.phone ?? '',
      email: client.email ?? '',
      notes: client.notes ?? '',
    },
  });

  const onSubmit = handleSubmit((values) => {
    updateClient.mutate({ id: client.id, body: values }, { onSuccess: onClose });
  });

  const error = updateClient.error instanceof ApiError ? updateClient.error.message : null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit client</DialogTitle>
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
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateClient.isPending}>
              {updateClient.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
