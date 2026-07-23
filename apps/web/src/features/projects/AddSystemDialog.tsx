import { zodResolver } from '@hookform/resolvers/zod';
import {
  createSystemRequestSchema,
  humaniseSystemType,
  type CreateSystemRequest,
  type SystemType,
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
import { useAddSystem } from './hooks';

// Spares and Consumables are auto-created, so they are not selectable here.
const SELECTABLE_TYPES: SystemType[] = ['POOL', 'FOUNTAIN', 'RO', 'STP', 'WTP'];

export function AddSystemDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const addSystem = useAddSystem(projectId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateSystemRequest>({
    resolver: zodResolver(createSystemRequestSchema),
    defaultValues: { type: 'POOL' },
  });

  const onSubmit = handleSubmit((values) => {
    addSystem.mutate(values, {
      onSuccess: () => {
        reset({ type: 'POOL' });
        setOpen(false);
      },
    });
  });

  const error = addSystem.error instanceof ApiError ? addSystem.error.message : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add system</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add system</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field label="Type" htmlFor="type" error={errors.type?.message}>
            <Select id="type" {...register('type')}>
              {SELECTABLE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {humaniseSystemType(type)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Label" htmlFor="label" error={errors.label?.message}>
            <Input id="label" placeholder="e.g. Main pool 25 m" {...register('label')} />
          </Field>
          <Field label="Notes" htmlFor="notes" error={errors.notes?.message}>
            <Input id="notes" {...register('notes')} />
          </Field>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addSystem.isPending}>
              {addSystem.isPending ? 'Adding…' : 'Add system'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
